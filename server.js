const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

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

// EDITAR PEDIDO EXISTENTE
app.post("/editar", async (req, res) => {
  const { id, cliente, rota, dataentrega, itens } = req.body;

  if (!id || !cliente || !rota || !dataentrega || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).send("Dados inválidos");
  }

  let lista = await ler(pedidosFile);
  const index = lista.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).send("Pedido não encontrado");
  }

  lista[index] = { id, cliente, rota, dataentrega, itens };
  await salvar(pedidosFile, lista);

  res.json({ ok: true });
});

// EXCLUIR PEDIDO
app.post("/excluir", async (req, res) => {
  const { id } = req.body;
  let lista = await ler(pedidosFile);

  lista = lista.filter(p => p.id !== id);
  await salvar(pedidosFile, lista);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});