const API_URL = "https://script.google.com/macros/s/AKfycbzsMjeSBWAgc0C26hjEjgey7__xXLIRU1X6lZy5F8rKtAktupqGC700n--N1fwpMWe7sg/exec"; // Substitua pela sua

document.getElementById('produto-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const dados = {
    nome: document.getElementById('nome').value,
    codigo: document.getElementById('codigo').value,
    lote: document.getElementById('lote').value,
    quantidade: document.getElementById('quantidade').value,
    preco: document.getElementById('preco').value,
    validade: document.getElementById('validade').value,
  };

  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(dados),
    headers: { 'Content-Type': 'application/json' }
  });

  alert("Produto salvo!");
  document.getElementById('produto-form').reset();
  carregarProdutos();
});

async function carregarProdutos() {
  const res = await fetch(API_URL);
  const produtos = await res.json();

  const lista = document.getElementById('lista-produtos');
  lista.innerHTML = "";

  produtos.forEach(prod => {
    const vencimento = new Date(prod.validade);
    const hoje = new Date();
    const diasRestantes = (vencimento - hoje) / (1000 * 60 * 60 * 24);

    let cor = "bg-green-100";
    if (diasRestantes < 0) cor = "bg-red-100";
    else if (diasRestantes < 15) cor = "bg-yellow-100";

    lista.innerHTML += `
      <div class="${cor} p-4 rounded shadow">
        <strong>${prod.nome}</strong> - Vence em: ${prod.validade}
        <div class="text-sm text-gray-600">Lote: ${prod.lote} | Quantidade: ${prod.quantidade}</div>
      </div>
    `;
  });
}

carregarProdutos();
