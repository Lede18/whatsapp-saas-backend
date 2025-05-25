const fs = require('fs');
const path = require('path');

function getProductos() {
  const filePath = path.join(__dirname, '../db/productos.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

module.exports = { getProductos };