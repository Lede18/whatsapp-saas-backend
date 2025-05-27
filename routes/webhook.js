// Nuevo webhook usando Function Calling de OpenAI
const express = require('express');
const router = express.Router();
const { chatWithFunctions } = require('../services/openaiFunctionService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { ejecutarFuncion } = require('../services/funcionesIA');

const VERIFY_TOKEN = "verifica123";

// 🔁 Verificación del Webhook (GET)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 📥 Webhook POST
router.post('/', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const message = entry?.changes?.[0]?.value?.messages?.[0];
    const phone = message?.from;
    const text = message?.text?.body;

    if (!text || !phone) return res.sendStatus(200);

    console.log("📥 Recibido:", text);

    // 🧠 Llamar a GPT con function calling
    const respuestaIA = await chatWithFunctions(text);

    // Si la IA pidió ejecutar una función...
    if (respuestaIA.function_call) {
      const resultado = await ejecutarFuncion(respuestaIA.function_call);
      await sendWhatsAppMessage(phone, resultado);
    } else {
      // Si solo es texto directo
      await sendWhatsAppMessage(phone, respuestaIA.content);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook IA:", err.message);
    res.sendStatus(500);
  }
});

module.exports = router;
