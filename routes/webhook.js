const express = require('express');
const router = express.Router();
const { getGPTResponse } = require('../services/openaiService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

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

    // 📦 Detectar si el usuario quiere cerrar el pedido
    if (textoNormalizado.includes("enviar pedido") || textoNormalizado.includes("finalizar") || textoNormalizado.includes("eso es todo")) {
      const resumen = memoriaPedidos[phone].map((item, i) => `- ${item}`).join("\n");

      const mensajeResumen = `Este es tu pedido hasta ahora:\n${resumen}\n¿Confirmas?`;
      await sendWhatsAppMessage(phone, mensajeResumen);

      // (Opcional) limpiar la memoria del cliente si ya no quieres acumular más
      // memoriaPedidos[phone] = [];
      return res.sendStatus(200);
    }

    // 🤖 GPT: generar respuesta en mensajes normales
    const prompt = `Eres un asistente para una tienda de suministros hidráulicos y conducciones de agua llamada SAIGA. Un cliente escribe: "${text}". Responde con educación y claridad como si fueras parte del equipo de atención e intenta ser breve en tus respuestas.`;
    const aiResponse = await getGPTResponse(prompt);

    await sendWhatsAppMessage(phone, aiResponse);

  } catch (err) {
    console.error("❌ Error procesando el webhook:", err.message);
  }

  res.sendStatus(200);
});

module.exports = router;