require("dotenv").config();
console.log("URL do banco:", process.env.DATABASE_URL);
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Conexão com o banco PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false
});

// Teste de conexão
sequelize.authenticate()
  .then(() => console.log("✅ Conexão com o banco estabelecida com sucesso!"))
  .catch(err => console.error("❌ Erro ao conectar com o banco:", err));

// Modelos
const Usuario = sequelize.define("Usuario", {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: "cliente" } // "cliente" ou "admin"
});

const Pedido = sequelize.define("Pedido", {
  cliente: { type: DataTypes.STRING, allowNull: false },
  rota: { type: DataTypes.STRING, allowNull: false },
  dataentrega: { type: DataTypes.STRING, allowNull: false },
  itens: { type: DataTypes.JSONB, allowNull: false }
});

sequelize.sync();

// Sincroniza modelos com o banco (cria tabelas se não existirem)
sequelize.sync().then(async () => {
  // Cria admin inicial se não existir
  const adminEmail = "admin@site.com";
  const adminSenha = "1234";

  const admin = await Usuario.findOne({ where: { email: adminEmail } });
  if (!admin) {
    await Usuario.create({ email: adminEmail, senha: adminSenha, role: "admin" });
    console.log("✅ Usuário admin inicial criado:", adminEmail, "/", adminSenha);
  } else {
    console.log("ℹ️ Usuário admin já existe:", adminEmail);
  }
});

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

// REGISTRO DE CLIENTE
app.post("/register", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).send("Email e senha obrigatórios");
  }

  try {
    await Usuario.create({ email, senha, role: "cliente" });
    res.json({ ok: true, msg: "Cliente registrado com sucesso!" });
  } catch (err) {
    res.status(400).json({ ok: false, msg: "Erro ao registrar cliente", error: err });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const user = await Usuario.findOne({ where: { email, senha } });

  if (!user) {
    return res.json({ ok: false, msg: "Credenciais inválidas" });
  }

  // Se for admin → acesso total
  if (user.role === "admin") {
    return res.json({ ok: true, role: "admin", redirect: "/dashboard" });
  }

  // Se for cliente → só pode acessar novo pedido
  return res.json({ ok: true, role: "cliente", redirect: "/novo-pedido" });
});

// LISTAR PEDIDOS (apenas admins)
app.get("/pedidos", async (req, res) => {
  const pedidos = await Pedido.findAll();
  res.json(pedidos);
});

// CRIAR NOVO PEDIDO (clientes e admins)
app.post("/pedidos", async (req, res) => {
  const { cliente, rota, dataentrega, itens } = req.body;

  if (!cliente || !rota || !dataentrega || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).send("Dados inválidos");
  }

  await Pedido.create({ cliente, rota, dataentrega, itens });
  res.json({ ok: true });
});

// EDITAR UM PEDIDO (apenas admins)
app.post("/editar", async (req, res) => {
  const { id, cliente, rota, dataentrega, itens } = req.body;
  const pedido = await Pedido.findByPk(id);

  if (!pedido) return res.status(404).send("Pedido não encontrado");

  await pedido.update({ cliente, rota, dataentrega, itens });
  res.json({ ok: true });
});

// EXCLUIR UM PEDIDO (apenas admins)
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