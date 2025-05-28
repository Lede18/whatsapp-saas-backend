const path = require('path');
const fs = require('fs');

// Ruta al archivo productos.json
const ruta = path.join(__dirname, '../db/productos.json');

function getProductos() {
  const raw = fs.readFileSync(ruta, 'utf-8');
  return JSON.parse(raw);
}

function buscarProductoPorAlias(descripcion) {
  const productos = getProductos();
  const normalizar = (str) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const buscado = normalizar(descripcion);

  return productos.find((p) =>
    [p.nombre, ...(p.alias || [])].some((texto) =>
      normalizar(texto).includes(buscado)
    )
  );
}

module.exports = { getProductos, buscarProductoPorAlias };
