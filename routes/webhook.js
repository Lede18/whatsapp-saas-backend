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
	console.log("✅ Recibido POST en /webhook");
console.log("BODY:", JSON.stringify(req.body, null, 2));
  const data = req.body;

  console.log("📥 LLEGÓ AL WEBHOOK:", JSON.stringify(data, null, 2));

  if (data.object) {
    const entry = data.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const phone = message.from;
      const text = message.text?.body;

      console.log(`📞 De: ${phone}`);
      console.log(`✉️  Mensaje: ${text}`);

      const client = getClientByPhone(phone);

      if (!client) {
        console.log("⚠️ Número no registrado");
      } else {
        const prompt = `Cliente: ${client.name}. Pedido: ${text}`;
        const aiResponse = await getGPTResponse(prompt);
        console.log("🤖 GPT responde:", aiResponse);
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router;