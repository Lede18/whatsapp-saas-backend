const express = require('express');
const router = express.Router();
const { getGPTResponse } = require('../services/openaiService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { getProductos } = require('../services/catalogService');
const { agregarPedido } = require('../services/googleSheetsService');

const VERIFY_TOKEN = "verifica123";

// 🧠 Memoria temporal por cliente (en RAM)
const memoriaPedidos = {};

// 🔁 Verificación del Webhook (GET)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta.");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Verificación fallida.");
  return res.sendStatus(403);
});

// 📥 Recepción de mensajes (POST)
router.post('/', async (req, res) => {
  console.log("✅ Recibido POST en /webhook");

  const data = req.body;

  try {
    const entry = data.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      console.warn("⚠️ No hay mensajes en el payload.");
      return res.sendStatus(200);
    }

    const phone = message.from;
    const text = message.text?.body;

    console.log("📥 Mensaje recibido:");
    console.log(`📞 De: ${phone}`);
    console.log(`✉️ Mensaje: ${text}`);

    // 🧠 Guardar el mensaje en la memoria del cliente
    if (!memoriaPedidos[phone]) {
      memoriaPedidos[phone] = [];
    }
    memoriaPedidos[phone].push(text);

    const textoNormalizado = text.toLowerCase();
    const productos = getProductos();

    // 📦 Detectar si el usuario quiere cerrar el pedido
    if (
      textoNormalizado.includes("enviar pedido") ||
      textoNormalizado.includes("finalizar") ||
      textoNormalizado.includes("eso es todo")
    ) {
      const articulosDetectados = memoriaPedidos[phone]
        .map((texto) => {
          const textoCliente = texto.toLowerCase();
          const producto = productos.find(p =>
            textoCliente.includes(p.nombre.toLowerCase()) ||
            (p.alias && p.alias.some(alias => textoCliente.includes(alias.toLowerCase())))
          );
          return producto || null;
        })
        .filter(Boolean);

      if (articulosDetectados.length > 0) {
        const mensajeResumen = `Este es tu pedido hasta ahora:\n${articulosDetectados.map(p => `- ${p.nombre} (${p.referencia})`).join("\n")}\n¿Confirmas?`;

        await sendWhatsAppMessage(phone, mensajeResumen);

        // ✅ Guardar pedido en Google Sheets
        await agregarPedido({
          telefono: phone,
          productos: articulosDetectados
        });

        // memoriaPedidos[phone] = []; // opcional si quieres limpiar
      } else {
        await sendWhatsAppMessage(phone, "No he podido identificar ningún artículo válido en tu pedido. ¿Puedes reformularlo?");
      }

      return res.sendStatus(200);
    }

    // 🤖 GPT: generar respuesta en mensajes normales
    const prompt = `Eres un asistente para una tienda de suministros hidráulicos y conducciones de agua llamada SAIGA.

Este es el catálogo disponible:
${productos.map(p => `- ${p.nombre} (${p.referencia})`).join("\n")}

El cliente ha dicho: "${text}".
Responde con educación y claridad, intentando relacionar lo que pide con los productos y referencias disponibles.
`;
    const aiResponse = await getGPTResponse(prompt);

    await sendWhatsAppMessage(phone, aiResponse);

  } catch (err) {
    console.error("❌ Error procesando el webhook:", err.message);
  }

  res.sendStatus(200);
});

module.exports = router;