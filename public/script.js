let user = JSON.parse(localStorage.getItem("user"));
let itens = [];

if (user) {
  document.getElementById("login").style.display = "none";
  document.getElementById("pdv").style.display = "block";
  carregarDados();
}

function login() {
  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  })
  .then(r => r.json())
  .then(u => {
    if (u.error) return alert(u.error);
    localStorage.setItem("user", JSON.stringify(u));
    location.reload();
  });
}

function carregarDados() {
  fetch("/api/clientes").then(r=>r.json()).then(c=>{
    cliente.innerHTML = c.map(x=>`<option value="${x.id}">${x.nome}</option>`).join("");
  });

  fetch("/api/produtos").then(r=>r.json()).then(p=>{
    produto.innerHTML = p.map(x=>`<option value="${x.id}" data-preco="${x.preco}">${x.nome}</option>`).join("");
  });
}

function addItem() {
  const opt = produto.selectedOptions[0];
  itens.push({
    produto_id: produto.value,
    quantidade: quantidade.value,
    preco: opt.dataset.preco
  });
  render();
}

function render() {
  lista.innerHTML = itens.map(i=>`<li>${i.quantidade} x ${i.preco}</li>`).join("");
}

function finalizarVenda() {
  fetch("/api/vendas", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      cliente_id: cliente.value,
      usuario_id: user.id,
      itens,
      frete: frete.value,
      brinde: brinde.value
    })
  }).then(()=> {
    alert("Venda finalizada");
    itens=[];
    render();
  });
}
