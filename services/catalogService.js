// Cargar productos desde JSON y exponerlos
const fs = require('fs');
const path = require('path');

// Ruta al archivo JSON
const productosPath = path.join(__dirname, '../db/productos.json');

function getProductos() {
  const raw = fs.readFileSync(productosPath, 'utf-8');
  const productos = JSON.parse(raw);
  return productos;
}

function buscarProductoPorAlias(entrada) {
  const productos = getProductos();
  const normalizar = txt => txt.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const texto = normalizar(entrada);

  return productos.find(p =>
    p.alias.some(alias => texto.includes(normalizar(alias))) ||
    texto.includes(normalizar(p.nombre))
  );
}

module.exports = { getProductos, buscarProductoPorAlias };
