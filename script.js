//Produtos Separados
let produtosLotes = [];


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
  
//1 - Listagem de Produtos Na Pagina Inicial
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
        <div class="bg-white shadow-lg rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-xl font-semibold" id="produtoNome">${produto.nome}</h3>
                    <p class="text-gray-600">Código: <span id="produtoCodigo">${produto.codigo}</span></p>
                </div>

                <div class="space-x-2 space-x-4 flex items-center">
                    <button title="Visualizar" onclick="visualizarProduto('${produtoId}')">
                      <i class="fas fa-eye w-6 h-6 text-blue-600 hover:text-blue-800 transition-colors"></i>
                    </button>
                    <button onclick='abrirModalEditarLotes(${JSON.stringify(produto)})'>
                      <i title="Editar" class="fas fa-edit text-yellow-600 px-4 rounded hover:text-yellow-800  transition-colors"></i>
                    </button>
                </div>
            </div>

            <!-- Lotes -->
            <h4 class="text-lg font-semibold mt-4"></h4>
            <div class="acoes-produto"></div>
            <div id="lotes-${produtoId}"></div>
        </div>
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
            
            console.log("dasd",diff);

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
            if (lote.diasRestantes < 0) classe = "bg-red-200 font-medium";
            else if (lote.diasRestantes <= 7) classe = "bg-orange-200 font-medium";
            else if (lote.diasRestantes <= 15) classe = "bg-blue-200 font-medium";
            else if (lote.diasRestantes <= 180) classe = "bg-green-200 font-medium";
  
            let mensagem = "";
            if (lote.diasRestantes < 0) {
              mensagem = `Lote vencido há ${Math.abs(lote.diasRestantes)-1} dia(s)`;
            } else if (lote.diasRestantes === 0) {
              mensagem = "Produto vence hoje";
            } else {
              mensagem = `Faltam ${lote.diasRestantes+1} dia(s) para vencer`;
            }
  
            const loteDiv = document.createElement('div');
            loteDiv.innerHTML = `
                <table class="w-full text-sm text-left border border-gray-300 mt-2 shadow-lg rounded-lg">
                    <thead class="bg-gray-200">
                    <tr>
                        <th class="p-2">Lote</th>
                        <th class="p-2">Quantidade</th>
                        <th class="p-2">Validade</th>
                    </tr>
                    </thead>
                    <tbody id="listaLotesProduto">
                    <tr class="${classe}">
                        <td class="p-2  ">${lote.lote}</td>
                        <td class="p-2  ">${lote.quantidade}</td>
                        <td class="p-2  ">
                          <span class="validade-lote text-sm" id="validadeLote">${formatarData(lote.validade)}</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
              
              <div class="text-end mb-8">
                <small>
                  <em>${mensagem}</em>
                </small>
              </div>
            `;
            loteContainer.appendChild(loteDiv);
          });
        });
      });
    });

    
  }
  
//Filtra Produtos E Listar Na Pagina Inicial
function filtrarProdutos() {
  carregarProdutos(); // Recarrega os produtos aplicando os filtros
}
//////////////////////////////////////////////////////////////////////////////////////////

//2 - Função para cadastrar um novo produto
let produtoTemp = null;
let lotesTemp = [];

function cadastrarProdutoModal() {
  const nome = document.getElementById('nomeProduto').value.trim();
  const codigo = document.getElementById('codigoProdutoNovo').value.trim();

	
  if (!nome || !codigo) {
    mostrarAlerta("Preencha todos os campos!","erro");
    return;
  }

  const id = crypto.randomUUID();
  produtoTemp = { id, nome, codigo };

  // Verificação de duplicidade pode ser feita depois se quiser
  
  
  //Desativar elementos
  document.getElementById('nomeProduto').style.pointerEvents = 'none' ; 
  document.getElementById('codigoProdutoNovo').style.pointerEvents = 'none' ;
  document.getElementById('btnSalvarProduto').style.display = 'none';
  
  //Libera os campos dos lotes
  document.getElementById('secaoLotes').style.display = 'block';
}

// Função para cadastar o lote temporário
function cadastrarLoteModal() {
  const lote = document.getElementById('lote').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const validade = document.getElementById('validade').value;

  if (!lote || !quantidade || !validade) {
    mostrarAlerta("Preencha todos os campos do lote!","erro");
    return;
  }

  // Verifica se já existe o mesmo lote
  if (lotesTemp.some(l => l.lote === lote)) {
    mostrarAlerta("Este lote já foi adicionado!","erro");
    return;
  }

  // Adiciona o lote à lista temporária
  const loteObj = { lote, quantidade, validade };
  lotesTemp.push(loteObj);

  renderizarTabelaLotes();

  // Limpa os campos de entrada para o próximo lote
  document.getElementById('lote').value = "";
  document.getElementById('quantidade').value = "";
  document.getElementById('validade').value = "";

}

function renderizarTabelaLotes() {
  const tbody = document.getElementById("tbodyLotesTemp");
  tbody.innerHTML = "";

  lotesTemp.forEach((lote, index) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";

    tr.innerHTML = `
      <td class="px-3 py-2">${lote.lote}</td>
      <td class="px-3 py-2">${lote.quantidade}</td>
      <td class="px-3 py-2">${lote.validade}</td>
      <td class="px-3 py-2 text-center">
        <button onclick="removerLoteTemporario(${index})" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Função para excluir o lote temporário
function removerLoteTemporario(index) {
  lotesTemp.splice(index, 1);
  renderizarTabelaLotes();
}

function salvarProdutoELotes() {
  if (!produtoTemp) {
    mostrarAlerta("Cadastre o produto e Lote(s).","erro");
  return;
  }

  db.collection("produtos").doc(produtoTemp.id).set(produtoTemp).then(() => {
    const lotesRef = db.collection("produtos").doc(produtoTemp.id).collection("lotes");

    const promises = lotesTemp.map(l =>
      lotesRef.add(l)
    );

    Promise.all(promises).then(() => {
      mostrarAlerta("Produto e lotes salvos com sucesso!","sucesso");
      resetarModalCadastarPreodutoLotes();
      fecharModalCadastrar();
      carregarProdutos();
    });
  });
  atualizarDashboard();
}

function cancelarCadastro() {
  resetarModalCadastarPreodutoLotes();
  fecharModalCadastrar();
}

function resetarModalCadastarPreodutoLotes() {
  produtoTemp = null;
  lotesTemp = [];

  document.getElementById('nomeProduto').value = "";
  document.getElementById('codigoProdutoNovo').value = "";
  document.getElementById('lote').value = "";
  document.getElementById('quantidade').value = "";
  document.getElementById('validade').value = "";
  document.getElementById("listaLotesTemp").innerHTML = "";
  
  document.getElementById('btnSalvarProduto').style.display = "block";
  document.getElementById('nomeProduto').style.pointerEvents = 'auto' ; 
  document.getElementById('codigoProdutoNovo').style.pointerEvents = 'auto' ; 

  document.getElementById('formProduto').style.display = 'block';
  document.getElementById('secaoLotes').style.display = 'none';

  renderizarTabelaLotes();
}
//////////////////////////////////////////////////////////////////////////////////////////

//3 - EXCLUSÃO DE PRODUTO E LOTES
function visualizarProduto(produtoId) {

  const modal = document.getElementById('myModalExcluirProdutosLotes');
  const tbody = document.getElementById("tbodyLotesProdutoExcluir");
  tbody.innerHTML = "";

  const informacaoProduto = document.getElementById('informacaoProduto');
  abrirModalExcluir();

  db.collection("produtos").doc(produtoId).get().then(doc => {
    const produto = doc.data();
    informacaoProduto.innerHTML = `
      <h3 class="text-xl font-semibold" id="produtoNome">${produto.nome}</h3>
      <p class="text-gray-600">Código: <span id="produtoCodigo">${produto.codigo}</span></p>
    `;
  });

  db.collection("produtos").doc(produtoId).collection("lotes").get().then(snapshot => {
    snapshot.forEach(doc => {
      const lote = doc.data();
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";

      tr.innerHTML = `
        <td class="px-3 py-2">${lote.lote}</td>
        <td class="px-3 py-2">${lote.quantidade}</td>
        <td class="px-3 py-2">${formatarData(lote.validade)}</td>
      `;
      tbody.appendChild(tr);
    });
  });

  modal.setAttribute("data-produto-id", produtoId);
}

function confirmarExclusaoProduto() {
  //if (!confirm("Tem certeza que deseja excluir este produto e todos os seus lotes?")) return;

  const modal = document.getElementById('myModalExcluirProdutosLotes');
  const produtoId = modal.getAttribute("data-produto-id");
  const loteRef = db.collection("produtos").doc(produtoId).collection("lotes");

  loteRef.get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(loteRef.doc(doc.id));
    });

    batch.commit().then(() => {
      db.collection("produtos").doc(produtoId).delete().then(() => {
        mostrarAlerta("Produto excluído com sucesso!","sucesso");
        fecharModalExcluir();
        carregarProdutos();
        atualizarDashboard();
      });
    });
  });
}
//////////////////////////////////////////////////////////////////////////////////////////

let produtoAtual = null;

//4 - EDIÇÃO DE LOTES
async function abrirModalEditarLotes(produto) {
  try {
    
    produtoAtual = { ...produto };
    console.log("Lostes Produto Atual",produtoAtual);

    // Referência para a subcoleção "lotes"
    const lotesRef = firebase.firestore()
      .collection("produtos")
      .doc(produto.id)
      .collection("lotes");

      console.log("Lostes Produto Atual",lotesRef);
    const snapshot = await lotesRef.get();

    //Carrega os lotes do produto
    lotesTemp = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log("Lostes temporarios",lotesTemp);

    // Atualiza campos do modal
    document.getElementById('editar-nome').textContent = produto.nome;
    document.getElementById('editar-codigo').textContent = produto.codigo;

    // Atualiza lista de lotes no modal
    atualizarListaLotesEdit();

    // Mostra o modal
    document.getElementById('modalEditarLotes').classList.remove('hidden');

  } catch (error) {
    console.error("Erro ao abrir modal e buscar lotes:", error);
  }
}

function fecharModalEditarLotes() {
  //Limpa e fecha os campos do novo lote
  cancelarNovoLote();
  
  document.getElementById('modalEditarLotes').classList.add('hidden');
}

//Edição dos lotes na lista
function atualizarListaLotesEdit() {
  const lista = document.getElementById('listaLotesEdit');
  lista.innerHTML = '';

  lotesTemp.forEach((lote, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-2">
        <input id="lote-input-${index}" class="w-full border rounded px-2 py-1 hidden" value="${lote.lote}" />
        <span id="lote-span-${index}">${lote.lote}</span>
      </td>
      <td class="px-4 py-2">
        <input id="quantidade-input-${index}" type="number" class="w-full border rounded px-2 py-1 hidden" value="${lote.quantidade}" />
        <span id="quantidade-span-${index}">${lote.quantidade}</span>
      </td>
      <td class="px-4 py-2">
        <input id="validade-input-${index}" type="date" class="w-full border rounded px-2 py-1 hidden" value="${lote.validade}" />
        <span id="validade-span-${index}">${formatarData(lote.validade)}</span>
      </td>
      <td class="px-4 py-2 text-center space-x-2">
        <button onclick="habilitarEdicaoLote(${index})" id="editar-btn-${index}" title="Editar Lote" class="text-blue-600 hover:text-blue-800">
          <i class="fas fa-edit"></i>
        </button>

        <button onclick="cancelarEdicaoLote()" id="cancelar-btn-${index}" title="Cancelar Edição" class="text-red-600 hover:text-red-800 hidden">
          <i class="fa-solid fa-x"></i>
        </button>

        <button onclick="confirmarEdicaoLote(${index})" id="confirmar-btn-${index}" title="Confirmar Edição" class="text-green-600 hover:text-green-800 hidden">
          <i class="fas fa-check"></i>
        </button>
        
        <button onclick="removerLoteTemp(${index})" id="remover-btn-${index}" title="Excluir Lote" class="text-red-600 hover:text-red-800">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    lista.appendChild(tr);
  });
}

function habilitarEdicaoLote(index) {
  document.getElementById(`lote-span-${index}`).classList.add('hidden');
  document.getElementById(`quantidade-span-${index}`).classList.add('hidden');
  document.getElementById(`validade-span-${index}`).classList.add('hidden');

  document.getElementById(`lote-input-${index}`).classList.remove('hidden');
  document.getElementById(`quantidade-input-${index}`).classList.remove('hidden');
  document.getElementById(`validade-input-${index}`).classList.remove('hidden');

  document.getElementById(`editar-btn-${index}`).classList.add('hidden');

  document.getElementById(`confirmar-btn-${index}`).classList.remove('hidden');
  document.getElementById(`cancelar-btn-${index}`).classList.remove('hidden');

  document.getElementById(`remover-btn-${index}`).classList.add('hidden');
}

function confirmarEdicaoLote(index) {
  const novoLote = document.getElementById(`lote-input-${index}`).value;
  const novaQtd = document.getElementById(`quantidade-input-${index}`).value;
  const novaVal = document.getElementById(`validade-input-${index}`).value;

  if (!novoLote || isNaN(novaQtd) || !novaVal) {
    mostrarAlerta("Preencha todos os campos corretamente!","erro");
    return;
  }

  lotesTemp[index] = {
    lote: novoLote,
    quantidade: novaQtd,
    validade: novaVal
  };

  mostrarAlerta("Lote editado com sucesso!","sucesso");
  atualizarListaLotesEdit();
}

function cancelarEdicaoLote(index) {
    atualizarListaLotesEdit();
}

function removerLoteTemp(index) {
  lotesTemp.splice(index, 1);
  mostrarAlerta("Lote removido com sucesso!","sucesso");
  atualizarListaLotesEdit();
}

function adicionarLoteEdit() {
  const lote = document.getElementById('novoLote').value.trim();
  const qtd = parseInt(document.getElementById('novaQtd').value);
  const validade = document.getElementById('novaValidade').value;

  if (!lote || isNaN(qtd) || !validade) {
    mostrarAlerta("Preencha todos os campos corretamente!","erro");
    return;
  }

  const duplicado = lotesTemp.some(l => l.lote.toLowerCase() === lote.toLowerCase());
  if (duplicado) {
    mostrarAlerta("Este lote já foi cadastrado!","erro");
    return;
  }

  lotesTemp.push({ lote, quantidade: qtd, validade });
  document.getElementById('novoLote').value = '';
  document.getElementById('novaQtd').value = '';
  document.getElementById('novaValidade').value = '';
  atualizarListaLotesEdit();
}
//FIM - Edição dos lotes na lista

//INICIO - Adição de novo lote
function mostrarFormularioNovoLote() {
  document.getElementById('adicionarNovoLote').classList.remove('hidden');
}

function cancelarNovoLote() {
  document.getElementById('novoLote').value = '';
  document.getElementById('novaQuantidade').value = '';
  document.getElementById('novaValidade').value = '';
  document.getElementById('adicionarNovoLote').classList.add('hidden');
}

function cadastrarNovoLote() {
  
  const lote = document.getElementById('novoLote').value.trim();
  const quantidade = document.getElementById('novaQuantidade').value;
  const validade = document.getElementById('novaValidade').value;

  if (!lote || !quantidade || !validade) {
    mostrarAlerta("Preencha todos os campos!","erro");
    return;
  }

  const duplicado = lotesTemp.some(l => l.lote.toLowerCase() === lote.toLowerCase());
  if (duplicado) {
    mostrarAlerta("Este lote já foi cadastrado!","erro");
    return;
  }

  // Supondo que você adicione o lote ao array `lotesTemp`
  lotesTemp.push({ lote, quantidade, validade });

  // Atualiza a lista
  atualizarListaLotesEdit();

  // Oculta o formulário e limpa os campos
  cancelarNovoLote();
}
//FIM - Adição de novo lote

function salvarLotesEditados() {
  // Aqui você atualizaria o Firestore ou seu banco com os lotesTemp
  console.log("Salvar lotes do produto:", produtoAtual, lotesTemp);

  mostrarAlerta("Produto e lote(s) editado(s) com sucesso!","sucesso");
  
  //Limpa e fecha os campos do novo lote
  cancelarNovoLote();

  fecharModalEditarLotes();

  atualizarDashboard();
}
//////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////
//5 - Início Dashboard

function abrirModalFaixa(faixa) {
  // Atualizar título
  let titulo = '';
  if (faixa === 'vencidos') titulo = 'Lotes Vencidos';
  else if (faixa === '0-7') titulo = 'Lotes Vencendo em 0-7 Dias';
  else if (faixa === '8-15') titulo = 'Lotes Vencendo em 8-15 Dias';
  else if (faixa === '16-180') titulo = 'Lotes Vencendo em 16-180 Dias';
  
  document.getElementById('modalTitulo').textContent = titulo;

  // Carregar dados da faixa
  carregarListaModal(faixa);

  // Mostrar modal
  document.getElementById('modalFaixa').classList.remove('hidden');
}

function fecharModalFaixa() {
  document.getElementById('modalFaixa').classList.add('hidden');
}

async function carregarProdutosLotes() {
  try {
    //Primeiro carrega os produtos
    const produtosSnapshot = await firebase.firestore().collection('produtos').get();
    
    for (const doc of produtosSnapshot.docs) {
      const produto = { id: doc.id, ...doc.data(), lotes: [] };

      const lotesSnapshot = await firebase.firestore()
        .collection('produtos')
        .doc(doc.id)
        .collection('lotes')  // Subcoleção de lotes (se for assim)
        .get();

      lotesSnapshot.forEach((loteDoc) => {
        produto.lotes.push({ id: loteDoc.id, ...loteDoc.data() });
      });

      produtosLotes.push(produto);
    }

  } catch (error) {
    console.error('Erro ao carregar produtos e lotes:', error);
  }
}

async function atualizarDashboard() {
  let produtosLotes = [];
  //Carrega todos Produtos e lotes
  try {
    //Primeiro carrega os produtos
    const produtosSnapshot = await firebase.firestore().collection('produtos').get();
    
    for (const doc of produtosSnapshot.docs) {
      const produto = { id: doc.id, ...doc.data(), lotes: [] };

      const lotesSnapshot = await firebase.firestore()
        .collection('produtos')
        .doc(doc.id)
        .collection('lotes')  // Subcoleção de lotes (se for assim)
        .get();

      lotesSnapshot.forEach((loteDoc) => {
        produto.lotes.push({ id: loteDoc.id, ...loteDoc.data() });
      });

      produtosLotes.push(produto);
    }

  } catch (error) {
    console.error('Erro ao carregar produtos e lotes:', error);
  }

  const hoje = new Date();
  const hojeFormatado = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  //Contar ototal de Produtos
  let totalProdutos = produtosLotes.length;
  let totalLotes = 0;

  produtosLotes.forEach(produto => {
  if (produto.lotes && Array.isArray(produto.lotes)) {
      totalLotes += produto.lotes.length;
    }
  });

  let vencendoHoje = 0;
  let vencidos = 0;
  let dias07 = 0;
  let dias815 = 0;
  let dias16180 = 0;

  produtosLotes.forEach(produto => {
    produto.lotes.forEach(lote => {
      const validade = criarDataLocal(lote.validade);
      console.log("Hoje:",hoje);
      console.log("Validade:",validade);
      
      const diffDias = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));

      console.log("Diferença:",diffDias);

      if (lote.validade === hojeFormatado) {
        vencendoHoje++;
      }
      if (diffDias < 0) {
        vencidos++;
      } else if (diffDias >= 0 && diffDias <= 7) {
        dias07++;
      } else if (diffDias >= 8 && diffDias <= 15) {
        dias815++;
      } else if (diffDias >= 16 && diffDias <= 180) {
        dias16180++;
      }
    });
  });

  document.getElementById('totalProdutos').textContent = totalProdutos;
  document.getElementById('totalLotes').textContent = totalLotes;
  document.getElementById('vencendoHoje').textContent = vencendoHoje;

  document.getElementById('vencidos').textContent = vencidos;
  document.getElementById('dias07').textContent = dias07;
  document.getElementById('dias815').textContent = dias815;
  document.getElementById('dias16180').textContent = dias16180;
}

function carregarListaModal(faixa) {
  const lista = document.getElementById('listaModalFaixa');
  lista.innerHTML = ''; // limpar antes
  const hoje = new Date();

  let lotesFiltrados = [];

  produtosLotes.forEach(produto => {
    produto.lotes.forEach(lote => {
      const validade = new Date(lote.validade);
      const diffDias = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));

      if (
        (faixa === 'vencidos' && diffDias < 0) ||
        (faixa === '0-7' && diffDias >= 0 && diffDias <= 7) ||
        (faixa === '8-15' && diffDias >= 8 && diffDias <= 15) ||
        (faixa === '16-180' && diffDias >= 16 && diffDias <= 180)
      ) {
        lotesFiltrados.push({
          produto: produto.nome,
          codigo: produto.codigo,
          lote: lote.lote,
          quantidade: lote.quantidade,
          vencimento: lote.validade
        });
      }
    });
  });

  if (lotesFiltrados.length === 0) {
    lista.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum lote encontrado</td></tr>`;
  } else {
    lotesFiltrados.forEach(lote => {
      lista.innerHTML += `
        <tr class="border-b border-gray-200 hover:bg-gray-100">
          <td class="py-3 px-6 text-left">${lote.produto}</td>
          <td class="py-3 px-6 text-left">${lote.codigo}</td>
          <td class="py-3 px-6 text-left">${lote.lote}</td>
          <td class="py-3 px-6 text-left">${lote.quantidade}</td>
          <td class="py-3 px-6 text-left">${lote.vencimento}</td>
        </tr>
      `;
    });
  }

  // Mostrar modal faixa
  document.getElementById('modalFaixa').classList.remove('hidden');
  console.log(produtosLotes);
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarDashboard();
});


//5 - Fim Dashboard

//Funções Auxliares
//1 - //Função Fixa Para Carregar Produtos
document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();
});
  
//2 - Formatar data
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = data.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
}

//3 - Abrir Modal Cadastar Produto e Lotes
function abrirModalCadastrar() {
  document.getElementById("myModalAdionarProdutosLotes").classList.remove("hidden");
}

//4 - Fechar Modal Cadastar Produto e Lotes
function fecharModalCadastrar() {
  document.getElementById("myModalAdionarProdutosLotes").classList.add("hidden");
}

//5 - Abrir Modal Excluir Produto e Lotes
function abrirModalExcluir() {
  document.getElementById("myModalExcluirProdutosLotes").classList.remove("hidden");
}
//6 - Fechar Modal Excluir Produto e Lotes
function fecharModalExcluir() {
  document.getElementById("myModalExcluirProdutosLotes").classList.add("hidden");
}

//7 - Função para mostrar os alertas
let timeoutAlerta; // variável para controlar o tempo do alerta

function mostrarAlerta(mensagem, tipo = 'sucesso') {
  const alertModal = document.getElementById('alertModal');
  const alertContent = document.getElementById('alertContent');

  // Se já tem um alerta sendo exibido, reseta
  clearTimeout(timeoutAlerta);

  // Define as cores baseado no tipo
  if (tipo === 'erro') {
    alertContent.className = 'bg-red-500 px-6 py-4 rounded shadow-lg text-white text-center text-lg';
  } else {
    alertContent.className = 'bg-green-500 px-6 py-4 rounded shadow-lg text-white text-center text-lg';
  }

  alertContent.textContent = mensagem;

  // Exibe o alerta
  alertModal.classList.remove('hidden');
  alertModal.classList.add('opacity-100');

  // Configura o tempo para esconder
  timeoutAlerta = setTimeout(() => {
    alertModal.classList.remove('opacity-100');
    alertModal.classList.add('opacity-0');

    setTimeout(() => {
      alertModal.classList.add('hidden');
      alertModal.classList.remove('opacity-0');
    }, 500); // tempo do fade-out
  }, 3000); // tempo de exibição
}

//8 - Função seção de busca
function mostrarSessaoBusca() {
  const sessao = document.getElementById('sessaoBusca');
  const icone = document.getElementById('iconeBusca');
  const textoBusca = document.getElementById('textoBusca');

  if (sessao.classList.contains('hidden')) {
    // Mostra a seção e troca o ícone para "X"
    sessao.classList.remove('hidden');
    iconeBusca.className = 'fas fa-times'; // Ícone de fechar (x)
    textoBusca.textContent = 'Fechar Buscar';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Esconde a seção e volta o ícone para "lupa"
    sessao.classList.add('hidden');
    iconeBusca.className = 'fas fa-search'; // Ícone de lupa
    textoBusca.textContent = 'Buscar Produto / Lote(s)';
  }
}

//9 - Criar data local
function criarDataLocal(dataTexto) {
  const partes = dataTexto.split('-');
  return new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
}

