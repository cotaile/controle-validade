
// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAeDjmmpMmrw_cBjGcDwdZ_iX3ZUP_Vd14",
  authDomain: "controle-final.firebaseapp.com",
  projectId: "controle-final",
  storageBucket: "controle-final.firebasestorage.app",
  messagingSenderId: "496972819545",
  appId: "1:496972819545:web:ef4b76c526391ddac9d548"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Função para abrir o modal de cadastro de produto
function abrirModalProduto() {
  document.getElementById('modalProduto').style.display = 'flex';
}

// Função para fechar o modal de cadastro de produto
function fecharModalProduto() {
  document.getElementById('modalProduto').style.display = 'none';
}

// Função para cadastrar um novo produto
let produtoTemp = null;
let lotesTemp = [];

function cadastrarProdutoModal() {
  const nome = document.getElementById('nomeProduto').value.trim();
  const codigo = document.getElementById('codigoProdutoNew').value.trim();

  if (!nome || !codigo) {
    alert("Preencha todos os campos.");
    return;
  }

  const id = crypto.randomUUID();
  produtoTemp = { id, nome, codigo };

  // Verificação de duplicidade pode ser feita depois se quiser
  
  
  //Desativar elementos
  document.getElementById('btnSalvarProduto').style.visibility = 'hidden';
  document.getElementById('nomeProduto').style.pointerEvents = 'none' ; 
  document.getElementById('codigoProduto').style.pointerEvents = 'none' ; 
  document.getElementById('secaoLotes').style.display = 'block';
}

function cadastrarLoteModal() {
  const lote = document.getElementById('lote').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const validade = document.getElementById('validade').value;

  if (!lote || !quantidade || !validade) {
    alert("Preencha todos os dados do lote.");
    return;
  }

  // Verifica se já existe o mesmo lote
  if (lotesTemp.some(l => l.lote === lote)) {
    alert("Este lote já foi adicionado.");
    return;
  }

  // Adiciona o lote à lista temporária
  const loteObj = { lote, quantidade, validade };
  lotesTemp.push(loteObj);

  // Cria a listagem visual com botão de exclusão
  const li = document.createElement("li");
  li.className = "list-group-item";
  li.textContent = `Lote: ${lote}, Qtd: ${quantidade}, Val: ${validade}`;

  // Botão para excluir o lote da lista
  const btnExcluir = document.createElement("button");
  btnExcluir.className = "btn btn-danger btn-sm ms-2";
  btnExcluir.textContent = "Excluir";
  btnExcluir.onclick = () => excluirLoteTemp(loteObj, li);

  // Adiciona o botão à listagem
  li.appendChild(btnExcluir);
  
  // Atualiza a lista de lotes na interface
  document.getElementById("listaLotesTemp").appendChild(li);

  // Limpa os campos de entrada para o próximo lote
  document.getElementById('lote').value = "";
  document.getElementById('quantidade').value = "";
  document.getElementById('validade').value = "";
}

// Função para excluir o lote temporário
function excluirLoteTemp(loteObj, li) {
  // Remove o lote da lista temporária
  lotesTemp = lotesTemp.filter(l => l !== loteObj);

  // Remove o lote da interface (listagem)
  li.remove();
}


function salvarProdutoELotes() {
  if (!produtoTemp) {
	alert("Cadastre o produto e Lote(s).");  
  return;
  }

  db.collection("produtos").doc(produtoTemp.id).set(produtoTemp).then(() => {
    const lotesRef = db.collection("produtos").doc(produtoTemp.id).collection("lotes");

    const promises = lotesTemp.map(l =>
      lotesRef.add(l)
    );

    Promise.all(promises).then(() => {
      alert("Produto e lotes salvos com sucesso!");
      resetarModal();
      carregarProdutos();
    });
  });
}

function cancelarCadastro() {
  if (confirm("Deseja sair sem salvar? Isso apagará o produto e os lotes adicionados.")) {
    resetarModal();
  }
}

function resetarModal() {
  produtoTemp = null;
  lotesTemp = [];

  document.getElementById('nomeProduto').value = "";
  document.getElementById('codigoProduto').value = "";
  document.getElementById('lote').value = "";
  document.getElementById('quantidade').value = "";
  document.getElementById('validade').value = "";
  document.getElementById("listaLotesTemp").innerHTML = "";
  
  document.getElementById('btnSalvarProduto').style.visibility = 'visible';
  document.getElementById('nomeProduto').style.pointerEvents = 'auto' ; 
  document.getElementById('codigoProduto').style.pointerEvents = 'auto' ; 

  document.getElementById('formProduto').style.display = 'block';
  document.getElementById('secaoLotes').style.display = 'none';

  fecharModalProduto();
}



// Função para carregar os produtos cadastrados
function carregarProdutos() {
  const lista = document.getElementById('listaProdutos');
  lista.innerHTML = "";

  // Obtendo os valores dos filtros
  const codigoProdutoFiltro = document.getElementById('codigoProduto').value.toLowerCase();
  const filtroLote = document.getElementById('filtroLote').value;

  db.collection("produtos").get().then(snapshot => {
    snapshot.forEach(doc => {
      const produto = doc.data();
      const produtoId = produto.id;

      // Verifica se o código do produto corresponde ao filtro
      if (codigoProdutoFiltro && !produto.codigo.toLowerCase().includes(codigoProdutoFiltro)) {
        return;
      }

      const div = document.createElement('div');
      div.className = 'produto';
      div.innerHTML = `
        <strong>${produto.nome}</strong> - Código: ${produto.codigo}
        <div class="acoes-produto">
          <button onclick="visualizarProduto('${produtoId}')" class="btn-icon" title="Visualizar">
            <i class="fa fa-eye"></i>
          </button>
          <button onclick="editarProduto('${produtoId}')" class="btn-icon" title="Editar">
            <i class="fa fa-pencil"></i>
          </button>
        </div>
        <div id="lotes-${produtoId}"></div>
      `;
      lista.appendChild(div);

      // Carregar lotes do produto e filtrar conforme a validade
      db.collection("produtos").doc(produto.id).collection("lotes").get().then(loteSnap => {
        const loteContainer = document.getElementById(`lotes-${produto.id}`);
        const lotes = [];

        loteSnap.forEach(loteDoc => {
          const lote = loteDoc.data();
          const validade = new Date(lote.validade);
          const hoje = new Date();
          const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

          lotes.push({
            ...lote,
            diasRestantes: diff
          });
        });

        // Filtrando lotes de acordo com o filtro de validade
        const lotesFiltrados = lotes.filter(lote => {
          if (filtroLote === 'proximos') {
            return lote.diasRestantes >= 0 && lote.diasRestantes <= 180;
          }
          return true; // Todos os lotes, caso o filtro seja 'todos'
        });

        // Ordenar os lotes do mais próximo vencimento para o mais distante
        lotesFiltrados.sort((a, b) => a.diasRestantes - b.diasRestantes);

        lotesFiltrados.forEach(lote => {
          let classe = "";
          if (lote.diasRestantes < 0) classe = "vermelho";
          else if (lote.diasRestantes <= 7) classe = "rosa";
          else if (lote.diasRestantes <= 15) classe = "laranja";
          else if (lote.diasRestantes <= 180) classe = "azul";

          let mensagem = "";
          if (lote.diasRestantes < 0) {
            mensagem = `Produto vencido há ${Math.abs(lote.diasRestantes)} dia(s)`;
          } else if (lote.diasRestantes === 0) {
            mensagem = "Produto vence hoje";
          } else {
            mensagem = `Faltam ${lote.diasRestantes} dia(s) para vencer`;
          }

          const loteDiv = document.createElement('div');
          loteDiv.className = `lote ${classe}`;
          loteDiv.innerHTML = `
            Lote: ${lote.lote} | Quantidade: ${lote.quantidade} | Validade: ${lote.validade}<br>
            <em>${mensagem}</em>
          `;
          loteContainer.appendChild(loteDiv);
        });
      });
    });
  });
}

function filtrarProdutos() {
  carregarProdutos(); // Recarrega os produtos aplicando os filtros
}





// Função para visualizar produto
function visualizarProduto(produto) {
  alert(`Visualizando Produto:\nNome: ${produto.nome}\nCódigo: ${produto.codigo}`);
}

// Função para editar produto
function editarProduto(produto) {
  alert(`Editar Produto:\nNome: ${produto.nome}\nCódigo: ${produto.codigo}`);
  // Aqui você pode abrir um modal de edição ou preencher os campos para edição.
}

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
});


// Evento de abrir o modal ao clicar no botão de adicionar produto
document.getElementById("btnAdicionarProduto").addEventListener("click", abrirModalProduto);


