const express = require('express');
const router = express.Router();
const { getClientByPhone } = require('../services/clientService');
const { getGPTResponse } = require('../services/openaiService');

// Endpoint para verificación del webhook
router.get('/', (req, res) => {
  const VERIFY_TOKEN = "verifica123";
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta.");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Endpoint para recibir mensajes de WhatsApp
router.post('/', async (req, res) => {
  const data = req.body;

  try {
    const entry = data.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      console.log("⚠️ No hay mensaje válido en el payload.");
      return res.sendStatus(200);
    }

    const phone = message.from;
    const text = message.text?.body;

    console.log("📥 Mensaje recibido:");
    console.log(`📞 De: ${phone}`);
    console.log(`✉️ Mensaje: ${text}`);

    // Aquí puedes continuar con lógica: buscar cliente, responder, etc.

  } catch (error) {
    console.error("❌ Error procesando el mensaje:", error);
  }

  res.sendStatus(200);
});


module.exports = router;