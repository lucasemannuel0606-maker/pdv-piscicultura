let user = JSON.parse(localStorage.getItem("user"));
let itens = [];
let clientesData = [];

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
  fetch("/api/clientes").then(r => r.json()).then(c => {
    clientesData = c;
    cliente.innerHTML = c.map(x => `<option value="${x.id}" data-tel="${x.telefone}">${x.nome}</option>`).join("");
  });

  fetch("/api/produtos").then(r => r.json()).then(p => {
    produto.innerHTML = p.map(x => `<option value="${x.id}" data-preco="${x.preco}">${x.nome}</option>`).join("");
  });
}

function addItem() {
  const opt = produto.selectedOptions[0];
  itens.push({
    produto_id: produto.value,
    quantidade: quantidade.value,
    preco: opt.dataset.preco,
    nome: opt.text
  });
  render();
}

function render() {
  lista.innerHTML = itens.map(i => `<li>${i.quantidade} x ${i.nome} - R$${i.preco}</li>`).join("");
}

function finalizarVenda() {
  fetch("/api/vendas", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      cliente_id: cliente.value,
      usuario_id: user.id,
      itens,
      frete: frete.value || 0,
      brinde: brinde.value || ""
    })
  }).then(() => {
    alert("Venda finalizada");
    itens = [];
    render();
  });
}

function enviarWhatsApp() {
  if (!cliente.value) return alert("Selecione um cliente");

  const clienteSelecionado = clientesData.find(c => c.id == cliente.value);
  if (!clienteSelecionado) return alert("Cliente não encontrado");

  let msg = `Olá ${clienteSelecionado.nome}, segue seu pedido:%0A`;

  itens.forEach(i => {
    msg += `- ${i.quantidade} x ${i.nome} (R$${i.preco})%0A`;
  });

  if (frete.value) msg += `Frete: R$${frete.value}%0A`;
  if (brinde.value) msg += `Brinde: ${brinde.value}%0A`;

  const total = itens.reduce((a,i)=>a+i.quantidade*i.preco,0)+Number(frete.value||0);
  msg += `Total: R$${total}`;

  const tel = clienteSelecionado.telefone.replace(/\D/g,'');
  const url = `https://wa.me/55${tel}?text=${msg}`;
  window.open(url,"_blank");
}
