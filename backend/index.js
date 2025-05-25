const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/webhook', webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
