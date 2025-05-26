const { obtenerEmbedding } = require('./embeddingService');

// Frases base que significan "confirmo"
const frasesConfirmacion = [
  // Castellano
  "sí", "si", "sí, eso quiero", "vale", "correcto", "confirmo",
  "eso mismo", "sí, adelante", "eso está bien", "vale, hazlo", "está perfecto",
  "eso es todo", "puedes enviarlo", "quiero eso", "es correcto",
  "finaliza el pedido", "confírmalo", "ya está bien", "sí, gracias",

  // Catalán
  "sí", "si", "sí, ho vull", "d'acord", "això vull", "això mateix", "tira endavant",
  "correcte", "ja està bé", "està bé", "endavant", "confirmo", "ho confirmo",
  "val", "sí, gràcies", "ja està", "pots enviar-ho"
];

// Calculamos sus embeddings una sola vez al arrancar
let embeddingsBase = [];

async function inicializarConfirmaciones() {
  embeddingsBase = await Promise.all(frasesConfirmacion.map(obtenerEmbedding));
  console.log("✅ Embeddings de confirmación cargados.");
}

// Función para comparar similitud
function similitudCoseno(vec1, vec2) {
  const dot = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dot / (mag1 * mag2);
}

// Función principal: ¿es confirmación?
async function esConfirmacion(textoCliente, umbral = 0.85) {
  const embCliente = await obtenerEmbedding(textoCliente);
  if (!embCliente) return false;

  for (const embBase of embeddingsBase) {
    const sim = similitudCoseno(embCliente, embBase);
    if (sim > umbral) return true;
  }

  return false;
}

module.exports = {
  inicializarConfirmaciones,
  esConfirmacion
};