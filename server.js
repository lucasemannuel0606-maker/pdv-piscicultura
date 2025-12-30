const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();

app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("pdv.db");

// ===== BANCO =====
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT UNIQUE,
    senha TEXT,
    perfil TEXT
  )`);

  db.run(`INSERT OR IGNORE INTO usuarios (user, senha, perfil)
          VALUES ('admin','admin','admin')`);

  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    fone TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    preco REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    produto TEXT,
    total REAL,
    frete REAL,
    brinde TEXT,
    vendedor TEXT,
    data TEXT
  )`);
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { user, senha } = req.body;
  db.get(
    "SELECT perfil FROM usuarios WHERE user=? AND senha=?",
    [user, senha],
    (_, row) => {
      if (!row) return res.status(401).json({ ok: false });
      res.json({ ok: true, perfil: row.perfil, user });
    }
  );
});

// ===== TROCAR SENHA =====
app.post("/trocar-senha", (req, res) => {
  const { user, senhaAtual, novaSenha } = req.body;
  db.get(
    "SELECT * FROM usuarios WHERE user=? AND senha=?",
    [user, senhaAtual],
    (_, row) => {
      if (!row) return res.status(401).json({ erro: true });
      db.run(
        "UPDATE usuarios SET senha=? WHERE user=?",
        [novaSenha, user],
        () => res.json({ ok: true })
      );
    }
  );
});

// ===== CRUD SIMPLES =====
const listar = (tabela, res) =>
  db.all(`SELECT * FROM ${tabela}`, (_, r) => res.json(r));

app.get("/clientes", (_, res) => listar("clientes", res));
app.get("/produtos", (_, res) => listar("produtos", res));
app.get("/vendas", (_, res) =>
  db.all("SELECT * FROM vendas ORDER BY id DESC", (_, r) => res.json(r))
);

app.post("/clientes", (req, res) => {
  db.run("INSERT INTO clientes VALUES (NULL,?,?)",
    [req.body.nome, req.body.fone],
    () => res.sendStatus(200)
  );
});

app.post("/produtos", (req, res) => {
  db.run("INSERT INTO produtos VALUES (NULL,?,?)",
    [req.body.nome, req.body.preco],
    () => res.sendStatus(200)
  );
});

app.post("/vendas", (req, res) => {
  const { cliente, produto, total, frete, brinde, vendedor } = req.body;
  db.run(
    "INSERT INTO vendas VALUES (NULL,?,?,?,?,?,?)",
    [cliente, produto, total, frete, brinde, vendedor, new Date().toLocaleString()],
    () => res.sendStatus(200)
  );
});

["clientes","produtos","vendas"].forEach(t =>
  app.delete(`/${t}/:id`, (req, res) => {
    db.run(`DELETE FROM ${t} WHERE id=?`, [req.params.id]);
    res.sendStatus(200);
  })
);

// ===== USUÁRIOS =====
app.get("/usuarios", (_, res) =>
  db.all("SELECT id,user,perfil FROM usuarios", (_, r) => res.json(r))
);

app.post("/usuarios", (req, res) => {
  const { user, senha, perfil } = req.body;
  db.run(
    "INSERT INTO usuarios (user,senha,perfil) VALUES (?,?,?)",
    [user, senha, perfil],
    err => err ? res.sendStatus(400) : res.sendStatus(200)
  );
});

app.delete("/usuarios/:id", (req, res) => {
  db.run("DELETE FROM usuarios WHERE id=? AND user!='admin'", [req.params.id]);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ PDV rodando na porta", PORT);
});

