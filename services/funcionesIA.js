// Funciones que GPT puede ejecutar al hacer function_call
const carrito = {}; // 🛒 Carrito en memoria temporal (por número)

function añadirProducto({ referencia, cantidad }, phone) {
  if (!carrito[phone]) carrito[phone] = [];

  carrito[phone].push({ referencia, cantidad });
  return `✅ Se han añadido ${cantidad} unidades del producto con referencia ${referencia} a tu pedido.`;
}

function confirmarPedido(_, phone) {
  if (!carrito[phone] || carrito[phone].length === 0) {
    return "⚠️ No hay productos en tu pedido para confirmar.";
  }

  const resumen = carrito[phone]
    .map(p => `- ${p.cantidad}x Ref ${p.referencia}`)
    .join("\n");

  delete carrito[phone]; // 🧹 Limpiar carrito al confirmar

  return `✅ Pedido confirmado:
${resumen}
Gracias por confiar en SAIGA. 🛠️`;
}

async function ejecutarFuncion(function_call, phone) {
  const nombre = function_call.name;
  const args = JSON.parse(function_call.arguments || '{}');

  if (nombre === "añadirProducto") return añadirProducto(args, phone);
  if (nombre === "confirmarPedido") return confirmarPedido(args, phone);

  return "⚠️ No entendí la acción que debo realizar.";
}

module.exports = { ejecutarFuncion };
