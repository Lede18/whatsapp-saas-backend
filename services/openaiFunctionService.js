const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🧠 Definición de funciones disponibles para la IA
const functions = [
  {
    name: "añadirProducto",
    description: "Añade un producto al carrito del cliente",
    parameters: {
      type: "object",
      properties: {
        referencia: { type: "string", description: "Referencia del producto" },
        cantidad: { type: "number", description: "Cantidad de unidades" }
      },
      required: ["referencia", "cantidad"]
    }
  },
  {
    name: "confirmarPedido",
    description: "Confirma y finaliza el pedido del cliente",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

// 🎯 Función principal que se llama desde el webhook
async function chatWithFunctions(mensajeCliente) {
  const respuesta = await openai.chat.completions.create({
    model: "gpt-4-1106-preview", // o "gpt-3.5-turbo-1106"
    messages: [
      {
        role: "system",
        content: "Eres un asistente experto en atención a clientes para una tienda de suministros hidráulicos llamada SAIGA. Gestionas productos por referencia y puedes añadir productos al carrito o confirmar pedidos usando funciones."
      },
      {
        role: "user",
        content: mensajeCliente
      }
    ],
    functions,
    function_call: "auto"
  });

  const respuestaIA = respuesta.choices[0].message;
  return respuestaIA;
}

module.exports = { chatWithFunctions };