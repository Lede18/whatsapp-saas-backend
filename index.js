const express = require('express');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware nativo para parsear JSON
app.use(express.json());

// Ruta base de prueba (evita que Railway cierre el contenedor por inactividad)
app.get('/', (req, res) => {
  res.send('🟢 Backend activo');
});

// Rutas de Webhook
app.use('/webhook', webhookRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('❌ uncaughtException:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ unhandledRejection:', reason);
});