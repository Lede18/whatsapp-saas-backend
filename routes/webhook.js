const express = require('express');
const router = express.Router();
const { getGPTResponse } = require('../services/openaiService'); // ✅ ACTIVADO
const { sendWhatsAppMessage } = require('../services/whatsappService');

const VERIFY_TOKEN = "verifica123";

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

    // 🤖 GPT: generamos respuesta automática
    const prompt = `Eres un asistente para una tienda de suministros hidraulicos y conducciones de agua llamada SAIGA. Un cliente escribe: "${text}". Responde con educación y claridad como si fueras parte del equipo de atención e intenta ser breve en tus respuestas`;
    const aiResponse = await getGPTResponse(prompt);

    await sendWhatsAppMessage(phone, aiResponse);

    // (Próximo paso: enviar respuesta por WhatsApp)

  } catch (err) {
    console.error("❌ Error procesando el webhook:", err.message);
  }

  res.sendStatus(200);
});

module.exports = router;