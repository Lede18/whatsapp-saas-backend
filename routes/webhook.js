const express = require('express');
const router = express.Router();
const { getGPTResponse } = require('../services/openaiService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { getProductos } = require('../services/catalogService');
const { esConfirmacion } = require('../services/confirmacionService');

const VERIFY_TOKEN = "verifica123";

// 🧠 Memoria temporal por cliente (en RAM)
const memoriaPedidos = {};

// 📏 Detección de cantidad con expresiones regulares
function detectarCantidad(texto, aliasProducto) {
  const regexNumero = new RegExp(`(\\d+)\\s*(unidades|uds|metros|m|x)?\\s*${aliasProducto}`, 'i');
  const regexUn = new RegExp(`\\b(un|una)\\s*${aliasProducto}`, 'i');

  if (regexNumero.test(texto)) {
    return parseInt(texto.match(regexNumero)[1]);
  } else if (regexUn.test(texto)) {
    return 1;
  }

  return 1;
}

// 🎯 Formato de resumen del producto según si es tubería u otro
function formatearLineaPedido(producto) {
  const nombre = producto.nombre.toLowerCase();
  if (nombre.includes("tubería") || nombre.includes("ml.") || nombre.includes("metro")) {
    return `- ${producto.cantidad}m ${producto.nombre} (${producto.referencia})`;
  }
  return `- ${producto.cantidad}x ${producto.nombre} (${producto.referencia})`;
}

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

    // 🧠 Inicializar memoria del cliente si no existe
    if (!memoriaPedidos[phone]) {
      memoriaPedidos[phone] = [];
    }
	
	// 🔍 Detección flexible de productos por alias (ignora plurales y "de")
// Normalización de texto y productos
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD") // elimina acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bde\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const textoClienteNormalizado = normalizarTexto(text); // ✅ FALTABA ESTA LÍNEA
const textoNormalizado = text.toLowerCase();
const productos = getProductos();

// Buscar productos por alias normalizados
const productosDetectados = productos.filter(p =>
  p.alias && p.alias.some(alias => {
    const aliasNormalizado = normalizarTexto(alias);
    return textoClienteNormalizado.includes(aliasNormalizado);
  })
);
// 🧠 Detectar cantidad genérica aunque no haya coincidencia de alias
const regexCantidadGeneral = /(\d+)\s*(manguitos|manguito|tubos|tubo|reducciones|reducción|pieza|unidades|metros|m)/i;
const matchGeneral = textoNormalizado.match(regexCantidadGeneral);

if (matchGeneral) {
  const cantidadDetectada = parseInt(matchGeneral[1]);
  memoriaPedidos[phone]._ultimaCantidadSugerida = cantidadDetectada;
  console.log("🧠 Cantidad detectada sin alias:", cantidadDetectada);
}

    // 🛒 Guardar productos + cantidad en memoria
    for (const producto of productosDetectados) {
  const cantidad = detectarCantidad(textoNormalizado, producto.nombre.toLowerCase());

  memoriaPedidos[phone].push({
    nombre: producto.nombre,
    referencia: producto.referencia,
    cantidad
  });

  // 🧠 Guardar último producto y cantidad sugerida para confirmar más tarde
  memoriaPedidos[phone]._ultimoProductoSugerido = producto;
  memoriaPedidos[phone]._ultimaCantidadSugerida = cantidad;
}

    // 📦 Detectar si el usuario quiere cerrar el pedido
    const quiereFinalizar =
      textoNormalizado.includes("enviar pedido") ||
      textoNormalizado.includes("finalizar") ||
      textoNormalizado.includes("eso es todo");

    // 🧠 Detectar confirmación semántica con embeddings
    const confirmacionSemantica = await esConfirmacion(text);
	// ✅ Confirmación final: si ya hay productos y el cliente dice "confirmo"
if (confirmacionSemantica && memoriaPedidos[phone].some(p => p?.nombre)) {
  const articulosDetectados = memoriaPedidos[phone]
    .filter(p => typeof p === 'object' && p.nombre)
    .map(formatearLineaPedido);

  const mensajeFinal = `✅ Pedido confirmado:\n${articulosDetectados.join("\n")}\nGracias por confiar en SAIGA. 🛠️`;

  await sendWhatsAppMessage(phone, mensajeFinal);

  // 🧹 Limpiar memoria y flags del carrito
  delete memoriaPedidos[phone];

  return res.sendStatus(200);
}
// 🧠 Si es una confirmación pero no se detectaron productos, usamos el último sugerido
if (confirmacionSemantica && productosDetectados.length === 0) {
  const sugerido = memoriaPedidos[phone]._ultimoProductoSugerido;
  const cantidadSugerida = memoriaPedidos[phone]._ultimaCantidadSugerida || 1;

  if (sugerido && !memoriaPedidos[phone]._sugeridoConfirmado) {
    memoriaPedidos[phone].push({
      nombre: sugerido.nombre,
      referencia: sugerido.referencia,
      cantidad: cantidadSugerida
    });
    memoriaPedidos[phone]._sugeridoConfirmado = true;
    console.log(`✅ Producto confirmado una sola vez: ${cantidadSugerida}x ${sugerido.nombre}`);
  }
}
    if (quiereFinalizar || confirmacionSemantica) {
      const articulosDetectados = memoriaPedidos[phone]
        .filter(p => typeof p === 'object' && p.nombre)
        .map(formatearLineaPedido);

      const mensajeResumen = articulosDetectados.length
        ? `✅ Este es tu pedido hasta ahora:\n${articulosDetectados.join("\n")}\n¿Confirmas?`
        : "⚠️ No he podido identificar ningún artículo válido en tu pedido. ¿Puedes reformularlo?";

      await sendWhatsAppMessage(phone, mensajeResumen);
      return res.sendStatus(200);
    }
	// 🧹 Limpiar flags de sugerencia confirmada para evitar duplicados
delete memoriaPedidos[phone]._ultimoProductoSugerido;
delete memoriaPedidos[phone]._ultimaCantidadSugerida;
delete memoriaPedidos[phone]._sugeridoConfirmado;

    // 🤖 GPT: generar respuesta en mensajes normales
    const prompt = `Eres un asistente para una tienda de suministros hidráulicos y conducciones de agua llamada SAIGA.

Este es el catálogo disponible:
${productos.map(p => `- ${p.nombre} (${p.referencia})`).join("\n")}

El cliente ha dicho: "${text}".
Responde con educación y claridad, intentando relacionar lo que pide con los productos y referencias disponibles.
`;

    const aiResponse = await getGPTResponse(prompt);
	// 🧠 Intenta detectar si GPT sugirió un único producto del catálogo
const productoSugerido = productos.find(p =>
  aiResponse.toLowerCase().includes(p.nombre.toLowerCase()) ||
  (p.alias && p.alias.some(alias => aiResponse.toLowerCase().includes(alias.toLowerCase())))
);

if (productoSugerido) {
  memoriaPedidos[phone]._ultimoProductoSugerido = productoSugerido;
} else {
  delete memoriaPedidos[phone]._ultimoProductoSugerido;
}
    await sendWhatsAppMessage(phone, aiResponse);

  } catch (err) {
    console.error("❌ Error procesando el webhook:", err.message);
  }

  res.sendStatus(200);
});

module.exports = router;
