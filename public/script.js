let usuarioLogado = "";

function showLoading(on) {
  loading.style.display = on ? "block" : "none";
}

function acao(fn, btn) {
  btn.disabled = true;
  showLoading(true);
  Promise.resolve(fn()).finally(() => {
    btn.disabled = false;
    showLoading(false);
  });
}

// ===== LOGIN =====
function fazerLogin() {
  fetch("/login", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ user:user.value, senha:senha.value })
  })
  .then(r => { if(!r.ok) throw 0; return r.json(); })
  .then(d => {
    usuarioLogado = d.user;
    login.style.display="none";
    pdv.style.display="block";
    if(d.perfil==="admin") boxUsuarios.style.display="block";
    init();
  })
  .catch(()=>alert("Login inválido"));
}

function init() {
  carregarClientes();
  carregarProdutos();
  carregarVendas();
  carregarUsuarios();
}

// ===== CLIENTES =====
function addCliente() {
  return fetch("/clientes", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ nome:cNome.value, fone:cFone.value })
  }).then(init);
}

function carregarClientes() {
  fetch("/clientes").then(r=>r.json()).then(d=>{
    listaClientes.innerHTML="";
    vCliente.innerHTML="";
    d.forEach(c=>{
      listaClientes.innerHTML+=`<li>${c.nome}
      <button class="remover" onclick="acao(()=>removerCliente(${c.id}),this)">×</button></li>`;
      vCliente.innerHTML+=`<option>${c.nome}</option>`;
    });
  });
}

function removerCliente(id) {
  return fetch(`/clientes/${id}`,{method:"DELETE"}).then(init);
}

// ===== PRODUTOS =====
function addProduto() {
  return fetch("/produtos", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ nome:pNome.value, preco:pPreco.value })
  }).then(init);
}

function carregarProdutos() {
  fetch("/produtos").then(r=>r.json()).then(d=>{
    listaProdutos.innerHTML="";
    vProduto.innerHTML="";
    d.forEach(p=>{
      listaProdutos.innerHTML+=`<li>${p.nome} R$${p.preco}
      <button class="remover" onclick="acao(()=>removerProduto(${p.id}),this)">×</button></li>`;
      vProduto.innerHTML+=`<option value="${p.preco}">${p.nome}</option>`;
    });
  });
}

function removerProduto(id) {
  return fetch(`/produtos/${id}`,{method:"DELETE"}).then(init);
}

// ===== VENDAS =====
function vender() {
  const total = Number(vProduto.value) + Number(vFrete.value);
  return fetch("/vendas", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      cliente:vCliente.value,
      produto:vProduto.options[vProduto.selectedIndex].text,
      total,
      frete:vFrete.value,
      brinde:vBrinde.value,
      vendedor:usuarioLogado
    })
  }).then(init);
}

function carregarVendas() {
  fetch("/vendas").then(r=>r.json()).then(d=>{
    listaVendas.innerHTML="";
    d.forEach(v=>{
      listaVendas.innerHTML+=`<li>${v.cliente} R$${v.total}
      <button class="remover" onclick="acao(()=>removerVenda(${v.id}),this)">×</button></li>`;
    });
  });
}

function removerVenda(id) {
  return fetch(`/vendas/${id}`,{method:"DELETE"}).then(init);
}

// ===== USUÁRIOS =====
function carregarUsuarios() {
  fetch("/usuarios").then(r=>r.json()).then(d=>{
    listaUsuarios.innerHTML="";
    d.forEach(u=>{
      listaUsuarios.innerHTML+=`<li>${u.user} (${u.perfil})
      ${u.user!=="admin"?`<button class="remover" onclick="acao(()=>removerUsuario(${u.id}),this)">×</button>`:""}
      </li>`;
    });
  });
}

function addUsuario() {
  return fetch("/usuarios", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      user:novoUser.value,
      senha:novaSenha.value,
      perfil:novoPerfil.value
    })
  }).then(carregarUsuarios);
}

function removerUsuario(id) {
  return fetch(`/usuarios/${id}`,{method:"DELETE"}).then(carregarUsuarios);
}

// ===== SENHA =====
function trocarSenha() {
  return fetch("/trocar-senha", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      user:usuarioLogado,
      senhaAtual:senhaAtual.value,
      novaSenha:novaSenhaTroca.value
    })
  })
  .then(r=>{ if(!r.ok) throw 0; alert("Senha alterada"); })
  .catch(()=>alert("Senha atual incorreta"));
}
