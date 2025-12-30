const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("pdv.db");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =====================
   🔐 TABELAS
===================== */

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK(role IN ('admin','vendedor'))
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  telefone TEXT,
  cidade TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  categoria TEXT,
  preco REAL
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  usuario_id INTEGER,
  subtotal REAL,
  frete REAL,
  brinde TEXT,
  total REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS venda_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER,
  produto_id INTEGER,
  quantidade REAL,
  preco_unitario REAL,
  total REAL
)
`).run();

/* =====================
   👤 USUÁRIO ADMIN PADRÃO
===================== */

const adminExists = db
  .prepare("SELECT * FROM users WHERE username = 'admin'")
  .get();

if (!adminExists) {
  db.prepare(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
  ).run("admin", "1234", "admin");
}

/* =====================
   🔐 LOGIN
===================== */

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?")
    .get(username, password);

  if (!user) return res.status(401).json({ error: "Login inválido" });

  res.json(user);
});

/* =====================
   👥 USUÁRIOS
===================== */

app.post("/api/users", (req, res) => {
  const { username, password, role } = req.body;
  db.prepare(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
  ).run(username, password, role);
  res.json({ success: true });
});

app.get("/api/users", (req, res) => {
  res.json(db.prepare("SELECT id, username, role FROM users").all());
});

/* =====================
   🧑 CLIENTES
===================== */

app.post("/api/clientes", (req, res) => {
  const { nome, telefone, cidade } = req.body;
  db.prepare(
    "INSERT INTO clientes (nome, telefone, cidade) VALUES (?, ?, ?)"
  ).run(nome, telefone, cidade);
  res.json({ success: true });
});

app.get("/api/clientes", (req, res) => {
  res.json(db.prepare("SELECT * FROM clientes").all());
});

/* =====================
   🐟 PRODUTOS
===================== */

app.post("/api/produtos", (req, res) => {
  const { nome, categoria, preco } = req.body;
  db.prepare(
    "INSERT INTO produtos (nome, categoria, preco) VALUES (?, ?, ?)"
  ).run(nome, categoria, preco);
  res.json({ success: true });
});

app.get("/api/produtos", (req, res) => {
  res.json(db.prepare("SELECT * FROM produtos").all());
});

/* =====================
   🧾 FINALIZAR VENDA (OTIMIZADO)
===================== */

app.post("/api/vendas", (req, res) => {
  const { cliente_id, usuario_id, itens, frete, brinde } = req.body;

  let subtotal = 0;
  itens.forEach(i => subtotal += i.preco * i.quantidade);

  const total = subtotal + (frete || 0);

  const venda = db.prepare(`
    INSERT INTO vendas (cliente_id, usuario_id, subtotal, frete, brinde, total)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cliente_id, usuario_id, subtotal, frete || 0, brinde || "", total);

  const insertItem = db.prepare(`
    INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, total)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    itens.forEach(i => {
      insertItem.run(
        venda.lastInsertRowid,
        i.produto_id,
        i.quantidade,
        i.preco,
        i.preco * i.quantidade
      );
    });
  });

  transaction();

  res.json({ success: true, venda_id: venda.lastInsertRowid });
});

/* =====================
   📊 RELATÓRIO DE VENDAS
===================== */

app.get("/api/relatorio", (req, res) => {
  const vendas = db.prepare(`
    SELECT v.id, c.nome AS cliente, u.username AS vendedor,
           v.subtotal, v.frete, v.brinde, v.total, v.created_at
    FROM vendas v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN users u ON u.id = v.usuario_id
    ORDER BY v.created_at DESC
  `).all();

  res.json(vendas);
});

/* =====================
   🚀 SERVER
===================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ PDV rodando na porta", PORT);
});
