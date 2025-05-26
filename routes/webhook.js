const express = require('express');
const router = express.Router();
const { getGPTResponse } = require('../services/openaiService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { getProductos } = require('../services/catalogService');
const { esConfirmacion } = require('../services/confirmacionService');

const VERIFY_TOKEN = "verifica123";

// 🧠 Memoria temporal por cliente (en RAM)
const memoriaPedidos = {};

// 📏 Detección de cantidad con expresiones regulares
function detectarCantidad(texto, aliasProducto) {
  const regex = new RegExp(`(\\d+)\\s*(unidades|uds|metros|m|x)?\\s*${aliasProducto}`, 'i');
  const match = texto.match(regex);
  return match ? parseInt(match[1]) : 1;
}

// 🎯 Formato de resumen del producto según si es tubería u otro
function formatearLineaPedido(producto) {
  const nombre = producto.nombre.toLowerCase();
  if (nombre.includes("tubería") || nombre.includes("ml.") || nombre.includes("metro")) {
    return `- ${producto.cantidad}m ${producto.nombre} (${producto.referencia})`;
  }
  return `- ${producto.cantidad}x ${producto.nombre} (${producto.referencia})`;
}

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

    // 🧠 Inicializar memoria del cliente si no existe
    if (!memoriaPedidos[phone]) {
      memoriaPedidos[phone] = [];
    }

    const textoNormalizado = text.toLowerCase();
    const productos = getProductos();

    // 🔍 Buscar productos en el mensaje del cliente
    const productosDetectados = productos.filter(p =>
  p.alias && p.alias.some(alias => textoNormalizado.includes(alias.toLowerCase()))
);

    // 🛒 Guardar productos + cantidad en memoria
    for (const producto of productosDetectados) {
      const cantidad = detectarCantidad(textoNormalizado, producto.nombre.toLowerCase());
      memoriaPedidos[phone].push({
        nombre: producto.nombre,
        referencia: producto.referencia,
        cantidad
      });
    }

    // 📦 Detectar si el usuario quiere cerrar el pedido
    const quiereFinalizar =
      textoNormalizado.includes("enviar pedido") ||
      textoNormalizado.includes("finalizar") ||
      textoNormalizado.includes("eso es todo");

    // 🧠 Detectar confirmación semántica con embeddings
    const confirmacionSemantica = await esConfirmacion(text);

    if (quiereFinalizar || confirmacionSemantica) {
      const articulosDetectados = memoriaPedidos[phone]
        .filter(p => typeof p === 'object' && p.nombre)
        .map(formatearLineaPedido);

      const mensajeResumen = articulosDetectados.length
        ? `✅ Este es tu pedido hasta ahora:\n${articulosDetectados.join("\n")}\n¿Confirmas?`
        : "⚠️ No he podido identificar ningún artículo válido en tu pedido. ¿Puedes reformularlo?";

      await sendWhatsAppMessage(phone, mensajeResumen);
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
