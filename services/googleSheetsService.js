const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../pedidosaiga-58aa75b2acb9.json'); // archivo de tu cuenta de servicio

const SHEET_ID = '1240ywpUdEg-1Ab2I7Yj-syeT6SruDySDkeMKxAlMSOo'; // ID de tu hoja de cálculo

async function agregarPedido({ telefono, productos }) {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0]; // primera pestaña

    const fecha = new Date().toLocaleString();

    for (const producto of productos) {
      await sheet.addRow({
        Fecha: fecha,
        Telefono: telefono,
        Articulo: producto.nombre,
        Referencia: producto.referencia
      });
    }

    console.log("✅ Pedido guardado en Google Sheets.");
  } catch (err) {
    console.error("❌ Error al guardar en Google Sheets:", err.message);
  }
}

module.exports = { agregarPedido };