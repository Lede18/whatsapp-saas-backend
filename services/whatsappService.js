const axios = require('axios');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📤 Mensaje enviado a WhatsApp:", response.data);
  } catch (err) {
    console.error("❌ Error al enviar mensaje a WhatsApp:", err.response?.data || err.message);
  }
}

module.exports = { sendWhatsAppMessage };
