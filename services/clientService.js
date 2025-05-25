const clients = require('../db/clientes.json');

const getClientByPhone = async (phone) => {
  return clients.find(c => c.phone === phone);
};

module.exports = { getClientByPhone };
