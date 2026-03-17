const express = require("express");
const cors = require("cors");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public")); // serve os arquivos HTML/CSS/JS da pasta public

// Conexão com o banco PostgreSQL (Render fornece DATABASE_URL)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false
});

// Modelos
const Usuario = sequelize.define("Usuario", {
  usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha: { type: DataTypes.STRING, allowNull: false }
});

const Pedido = sequelize.define("Pedido", {
  cliente: { type: DataTypes.STRING, allowNull: false },
  rota: { type: DataTypes.STRING, allowNull: false },
  dataentrega: { type: DataTypes.STRING, allowNull: false },
  itens: { type: DataTypes.JSONB, allowNull: false } // guarda array de itens
});

// Sincroniza modelos com o banco
sequelize.sync();

// Rotas principais
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/novo-pedido", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// LOGIN
app.post("/login", async (req, res) => {
  const { usuario, senha } = req.body;
  const ok = await Usuario.findOne({ where: { usuario, senha } });

  if (ok) {
    res.json({ ok: true, usuario });
  } else {
    res.json({ ok: false });
  }
});

// LISTAR PEDIDOS
app.get("/pedidos", async (req, res) => {
  const pedidos = await Pedido.findAll();
  res.json(pedidos);
});

// CRIAR NOVO PEDIDO
app.post("/pedidos", async (req, res) => {
  const { cliente, rota, dataentrega, itens } = req.body;

  if (!cliente || !rota || !dataentrega || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).send("Dados inválidos");
  }

  await Pedido.create({ cliente, rota, dataentrega, itens });
  res.json({ ok: true });
});

// EDITAR UM PEDIDO
app.post("/editar", async (req, res) => {
  const { id, cliente, rota, dataentrega, itens } = req.body;
  const pedido = await Pedido.findByPk(id);

  if (!pedido) return res.status(404).send("Pedido não encontrado");

  await pedido.update({ cliente, rota, dataentrega, itens });
  res.json({ ok: true });
});

// EXCLUIR UM PEDIDO
app.post("/excluir", async (req, res) => {
  const { id } = req.body;
  const pedido = await Pedido.findByPk(id);

  if (!pedido) return res.status(404).send("Pedido não encontrado");

  await pedido.destroy();
  res.json({ ok: true });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🐰 Servidor rodando na porta", PORT);
});