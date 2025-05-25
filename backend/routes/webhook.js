const express = require('express');
const router = express.Router();
const { getClientByPhone } = require('../services/clientService');
const { getGPTResponse } = require('../services/openaiService');

router.post('/', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body;

    const client = await getClientByPhone(from);

    if (!client) {
      return res.json({ reply: 'Este número no está registrado. Contacta con la tienda.' });
    }

    const prompt = `Cliente: ${client.name}. Pedido: ${text}`;
    const aiResponse = await getGPTResponse(prompt);

    return res.json({ reply: aiResponse });
  } catch (err) {
    console.error('Error en webhook:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
