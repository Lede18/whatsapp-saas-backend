const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function getGPTResponse(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('❌ Error al conectar con GPT:', err.message);
    return "Lo siento, hubo un error al generar la respuesta.";
  }
}

module.exports = { getGPTResponse };