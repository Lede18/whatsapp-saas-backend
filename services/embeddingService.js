const axios = require('axios');

async function obtenerEmbedding(texto) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: texto,
        model: 'text-embedding-3-small' // puedes cambiarlo a uno más potente si quieres
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error("❌ Error obteniendo embedding:", error.response?.data || error.message);
    return null;
  }
}

module.exports = { obtenerEmbedding };