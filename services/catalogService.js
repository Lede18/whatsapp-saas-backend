const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🧠 Definición de funciones disponibles para la IA
const functions = [
  {
    name: "addProduct", // ✅ nombre válido
    description: "Añade un producto al carrito del cliente",
    parameters: {
      type: "object",
      properties: {
        referencia: { type: "string", description: "Referencia del producto (opcional si se proporciona descripción)" },
        descripcion: { type: "string", description: "Descripción del producto, como nombre o alias conocido (opcional si se proporciona referencia)" },
        cantidad: { type: "number", description: "Cantidad de unidades" }
      },
      required: ["cantidad"]
    }
  },
  {
    name: "confirmOrder", // ✅ nombre válido
    description: "Confirma y finaliza el pedido del cliente",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "viewCart",
    description: "Muestra los productos actualmente en el carrito del cliente",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

// 🎯 Función principal que se llama desde el webhook
async function chatWithFunctions(mensajeCliente) {
  const respuesta = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: `Eres un asistente experto en atención a clientes para una tienda de suministros hidráulicos llamada SAIGA. Puedes usar funciones para:

- Añadir productos al carrito (usa \"addProduct\") cuando el cliente mencione una referencia, una descripción, o una combinación con cantidad.
- Confirmar pedidos (usa \"confirmOrder\") cuando el cliente diga cosas como \"finalizar pedido\", \"confirmo\", \"envíalo\", \"sí, eso quiero\", etc.
- Mostrar el carrito actual (usa \"viewCart\") cuando el cliente pregunte cosas como \"¿qué he pedido?\", \"¿qué hay en el carrito?\", \"ver mi pedido\", \"mostrar carrito\".

Siempre que sea posible, responde de forma clara, amable y breve.`
      },
      {
        role: "user",
        content: mensajeCliente
      }
    ],
    functions,
    function_call: "auto"
  });

  return respuesta.choices[0].message;
}

module.exports = { chatWithFunctions };
