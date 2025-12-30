const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("pdv.db");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== TABELAS ================== */

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  telefone TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
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
  data DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS venda_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER,
  produto_id INTEGER,
  quantidade REAL,
  preco REAL
)
`).run();

/* ================== ADMIN PADRÃO ================== */

const admin = db.prepare(
  "SELECT * FROM users WHERE username='admin'"
).get();

if (!admin) {
  db.prepare(
    "INSERT INTO users (username,password,role) VALUES (?,?,?)"
  ).run("admin", "1234", "admin");
}

/* ================== LOGIN ================== */

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare(
    "SELECT id, username, role FROM users WHERE username=? AND password=?"
  ).get(username, password);

  if (!user) return res.status(401).json({ error: "Login inválido" });

  res.json(user);
});

/* ================== TROCAR SENHA ================== */

app.post("/api/trocar-senha", (req, res) => {
  const { user_id, senha_atual, nova_senha } = req.body;

  const user = db.prepare(
    "SELECT * FROM users WHERE id=? AND password=?"
  ).get(user_id, senha_atual);

  if (!user) return res.status(400).json({ error: "Senha atual incorreta" });

  db.prepare(
    "UPDATE users SET password=? WHERE id=?"
  ).run(nova_senha, user_id);

  res.json({ success: true });
});

/* ================== CLIENTES ================== */

app.get("/api/clientes", (req, res) => {
  res.json(db.prepare("SELECT * FROM clientes").all());
});

app.post("/api/clientes", (req, res) => {
  const { nome, telefone } = req.body;
  db.prepare(
    "INSERT INTO clientes (nome,telefone) VALUES (?,?)"
  ).run(nome, telefone);
  res.json({ success: true });
});

/* ================== PRODUTOS ================== */

app.get("/api/produtos", (req, res) => {
  res.json(db.prepare("SELECT * FROM produtos").all());
});

app.post("/api/produtos", (req, res) => {
  const { nome, preco } = req.body;
  db.prepare(
    "INSERT INTO produtos (nome,preco) VALUES (?,?)"
  ).run(nome, preco);
  res.json({ success: true });
});

/* ================== FINALIZAR VENDA ================== */

app.post("/api/vendas", (req, res) => {
  const { cliente_id, usuario_id, itens, frete, brinde } = req.body;

  let subtotal = 0;
  itens.forEach(i => subtotal += i.preco * i.quantidade);

  const total = subtotal + (frete || 0);

  const venda = db.prepare(`
    INSERT INTO vendas
    (cliente_id, usuario_id, subtotal, frete, brinde, total)
    VALUES (?,?,?,?,?,?)
  `).run(cliente_id, usuario_id, subtotal, frete || 0, brinde || "", total);

  const stmt = db.prepare(`
    INSERT INTO venda_itens
    (venda_id, produto_id, quantidade, preco)
    VALUES (?,?,?,?)
  `);

  const trx = db.transaction(() => {
    itens.forEach(i => {
      stmt.run(
        venda.lastInsertRowid,
        i.produto_id,
        i.quantidade,
        i.preco
      );
    });
  });

  trx();
  res.json({ success: true });
});

/* ================== SERVER ================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log("✅ PDV rodando na porta", PORT)
);
