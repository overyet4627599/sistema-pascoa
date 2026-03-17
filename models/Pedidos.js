const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Pedido = sequelize.define("Pedido", {
  cliente: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rota: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dataentrega: {
    type: DataTypes.STRING,
    allowNull: false
  },
  itens: {
    type: DataTypes.JSONB, // guarda array de itens
    allowNull: false
  }
});

module.exports = Pedido;