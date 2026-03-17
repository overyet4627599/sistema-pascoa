const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public")); // serve os arquivos HTML/CSS/JS da pasta public

const pedidosFile = "./database/pedidos.json";
const usuariosFile = "./database/usuarios.json";

// Funções utilitárias
async function ler(file) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function salvar(file, dados) {
  await fs.writeFile(file, JSON.stringify(dados, null, 2));
}

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
  const usuarios = await ler(usuariosFile);

  const ok = usuarios.find(u => u.usuario === usuario && u.senha === senha);

  if (ok) {
    res.json({ ok: true, usuario });
  } else {
    res.json({ ok: false });
  }
});

// LISTAR PEDIDOS
app.get("/pedidos", async (req, res) => {
  const pedidos = await ler(pedidosFile);
  res.json(pedidos);
});

// CRIAR NOVO PEDIDO
app.post("/pedidos", async (req, res) => {
  const { cliente, rota, dataentrega, itens } = req.body;

  if (!cliente || !rota || !dataentrega || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).send("Dados inválidos");
  }

  const lista = await ler(pedidosFile);

  const novo = {
    id: Date.now(),
    cliente,
    rota,
    dataentrega,
    itens
  };

  lista.push(novo);
  await salvar(pedidosFile, lista);

  res.json({ ok: true });
});

// EDITAR UM PEDIDO (adicionar/remover itens, atualizar dados)
app.post("/editar", async (req, res) => {
  const { id, cliente, rota, dataentrega, itens } = req.body;
  let lista = await ler(pedidosFile);

  const index = lista.findIndex(p => p.id === Number(id));
  if (index === -1) {
    return res.status(404).send("Pedido não encontrado");
  }

  lista[index] = { id: Number(id), cliente, rota, dataentrega, itens };
  await salvar(pedidosFile, lista);

  res.json({ ok: true });
});

// EXCLUIR UM PEDIDO ESPECÍFICO
app.post("/excluir", async (req, res) => {
  const { id } = req.body;
  let lista = await ler(pedidosFile);

  const antes = lista.length;
  lista = lista.filter(p => p.id !== Number(id));

  if (lista.length === antes) {
    return res.status(404).send("Pedido não encontrado");
  }

  await salvar(pedidosFile, lista);
  res.json({ ok: true });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🐰 Servidor rodando na porta", PORT);
});