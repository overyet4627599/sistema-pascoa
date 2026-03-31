const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Usuario = sequelize.define("Usuario", {
  usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Usuario;