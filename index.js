const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Rutas
app.use('/webhook', webhookRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});