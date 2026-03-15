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

// PEDIDOS
app.get("/pedidos", async (req, res) => {
  const pedidos = await ler(pedidosFile);
  res.json(pedidos);
});

app.post("/pedidos", async (req, res) => {
 const { cliente, sabor, casca, tamanho, valor, rota, dataentrega } = req.body;
if (!cliente || !sabor || !casca || !tamanho || !valor || !rota || !dataentrega) {
  return res.status(400).send("Dados inválidos");
}

const lista = await ler(pedidosFile);
const novo = { id: Date.now(), cliente, sabor, casca, tamanho, valor, rota, dataentrega };

lista.push(novo);
await salvar(pedidosFile, lista);

res.json({ ok: true });
});

// EXCLUIR
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