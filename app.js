/* === app.js === */
/* (Este é o "Cérebro" com a lógica do app) */

// Define o nome da chave de Configurações
const CONFIG_KEY = 'marketConfig';

/* * =====================================
 * TAREFA 15.1: CARREGAR FOTO NO HEADER
 * =====================================
 */
function carregarDadosGlobaisUsuario() {
    const config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    const headerPic = document.getElementById('header-profile-pic');
    
    if (headerPic && config.profilePic) {
        headerPic.src = config.profilePic;
    }
}
carregarDadosGlobaisUsuario();


// --- LÓGICA DA PÁGINA DE LOGIN ---
const loginForm = document.getElementById('form-login');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        if (email === 'admin' && senha === '123') {
            alert('Login bem-sucedido! Bem-vindo.');
            localStorage.setItem('userToken', 'admin-logado-12345'); 
            window.location.href = 'dashboard.html';
        } else {
            alert('Usuário ou senha incorretos! Tente "admin" e "123".');
        }
    });
}

// --- LÓGICA DE LOGOUT (BOTÃO SAIR) ---
const logoutButton = document.querySelector('.sidebar-footer a');
if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        if (confirm('Você tem certeza que deseja sair?')) {
            localStorage.removeItem('userToken');
            window.location.href = 'login.html';
        }
    });
}

/* * =====================================
 * TAREFA 13.1: LÓGICA DE REGISTRO DE ATIVIDADES
 * =====================================
 */
function logActivity(icon, color, title, description) {
    let activities = JSON.parse(localStorage.getItem('listaDeAtividades')) || [];
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newActivity = { icon, color, title, description, time };
    activities.unshift(newActivity);
    if (activities.length > 10) {
        activities = activities.slice(0, 10);
    }
    localStorage.setItem('listaDeAtividades', JSON.stringify(activities));
}


/* * =====================================
 * LÓGICA DO MODAL DE CONFIRMAÇÃO
 * =====================================
 */
const modalOverlay = document.getElementById('delete-modal');
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalBtnConfirm = document.getElementById('modal-btn-confirm');
const modalCloseIcon = document.querySelector('.modal-close-icon');

function openModal() {
    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
    }
}
function closeModal() {
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
        modalOverlay.removeAttribute('data-sku');
        modalOverlay.removeAttribute('data-name');
    }
}

if (modalOverlay) {
    modalBtnCancel.addEventListener('click', closeModal);
    modalCloseIcon.addEventListener('click', closeModal);

    modalBtnConfirm.addEventListener('click', () => {
        const skuParaDeletar = modalOverlay.dataset.sku;
        const nomeParaDeletar = modalOverlay.dataset.name;

        if (skuParaDeletar) {
            let produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
            const produtoDeletado = produtos.find(p => p.sku === skuParaDeletar);
            
            produtos = produtos.filter(p => p.sku !== skuParaDeletar);
            localStorage.setItem('listaDeProdutos', JSON.stringify(produtos));
            
            if(produtoDeletado) {
                logActivity('fas fa-trash-alt', 'red', 'Produto Excluído', `O produto "${produtoDeletado.nome}" foi removido.`);
            }
            alert('Produto excluído com sucesso!');
        } 
        else if (nomeParaDeletar) {
            let categorias = JSON.parse(localStorage.getItem('listaDeCategorias')) || [];
            categorias = categorias.filter(c => c !== nomeParaDeletar);
            localStorage.setItem('listaDeCategorias', JSON.stringify(categorias));
            logActivity('fas fa-trash-alt', 'red', 'Categoria Excluída', `A categoria "${nomeParaDeletar}" foi removida.`);
            alert('Categoria excluída com sucesso!');
        }
        closeModal();
        window.location.reload(); 
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (CRIAR)
 * =====================================
 */
const formAddProduct = document.getElementById('form-add-product');
if (formAddProduct) {
    formAddProduct.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const nome = document.getElementById('nome-produto').value;
        const sku = document.getElementById('sku-produto').value;
        const categoria = document.getElementById('categoria-produto').value;
        const custo = parseFloat(document.getElementById('preco-custo').value) || 0;
        const venda = parseFloat(document.getElementById('preco-venda').value) || 0;
        const qtd = parseInt(document.getElementById('qtd-inicial').value) || 0;
        const vencimento = document.getElementById('data-vencimento').value;
        const estoqueMinimo = parseInt(document.getElementById('estoque-minimo').value) || 10;

        const novoProduto = { nome, sku, categoria, custo, venda, qtd, vencimento, estoqueMinimo };
        
        let produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        produtos.push(novoProduto);
        localStorage.setItem('listaDeProdutos', JSON.stringify(produtos));
        logActivity('fas fa-box', 'blue', 'Novo Produto Cadastrado', `"${nome}" foi adicionado ao sistema.`);
        alert('Produto "' + nome + '" cadastrado com sucesso!');
        window.location.href = 'produtos.html';
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (LISTAR - REFATORADO)
 * =====================================
 */
const productTableBody = document.getElementById('product-table-body');
// (Esta função é nova, ela desenha a tabela)
function renderProductTable(produtosParaRenderizar) {
    // Primeiro, verifica se a tabela existe na página atual
    const tabela = document.getElementById('product-table-body');
    if (!tabela) return; // Sai da função se não estiver na página de produtos

    tabela.innerHTML = ''; // Limpa a tabela

    if (produtosParaRenderizar.length > 0) {
        produtosParaRenderizar.forEach(produto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.sku}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td><span class="stock-ok">${produto.qtd}</span></td>
                <td>R$ ${produto.venda.toFixed(2)}</td>
                <td>
                    <button class="btn-action edit" data-sku="${produto.sku}">Editar</button>
                    <button class="btn-action delete" data-sku="${produto.sku}">Excluir</button>
                </td>
            `;
            tabela.appendChild(tr);

            // Ativa o botão Excluir
            const deleteButton = tr.querySelector('.btn-action.delete');
            deleteButton.addEventListener('click', (event) => {
                event.preventDefault();
                const sku = event.target.closest('.btn-action.delete').getAttribute('data-sku');
                modalOverlay.dataset.sku = sku; 
                openModal();
            });

            // Ativa o botão Editar
            const editButton = tr.querySelector('.btn-action.edit');
            editButton.addEventListener('click', (event) => {
                event.preventDefault();
                const sku = event.target.closest('.btn-action.edit').getAttribute('data-sku');
                window.location.href = `editar-produto.html?sku=${sku}`;
            });
        });
    } else {
        // Mensagem de "Nenhum produto" pode ser "encontrado" (se filtrado) ou "cadastrado"
        tabela.innerHTML = '<tr><td colspan="6">Nenhum produto encontrado.</td></tr>';
    }
}

// (Esta lógica agora só prepara os filtros e chama a renderização inicial)
if (productTableBody) {
    // 1. Pega a lista completa de produtos
    const todosProdutos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
    
    // 2. Renderiza a tabela pela primeira vez com todos os produtos
    renderProductTable(todosProdutos);
}


/* * =====================================
 * LÓGICA DE CATEGORIAS
 * =====================================
 */
const formAddCategory = document.getElementById('form-add-categoria');
if (formAddCategory) {
    formAddCategory.addEventListener('submit', function(event) {
        event.preventDefault();
        const categoryNameInput = document.getElementById('nome-categoria');
        const categoryName = categoryNameInput.value;
        if (!categoryName) {
            alert('Por favor, digite o nome da categoria.');
            return;
        }
        let categorias = JSON.parse(localStorage.getItem('listaDeCategorias')) || [];
        categorias.push(categoryName);
        localStorage.setItem('listaDeCategorias', JSON.stringify(categorias));
        logActivity('fas fa-tags', 'gray', 'Nova Categoria Adicionada', `A categoria "${categoryName}" foi criada.`);
        alert('Categoria "' + categoryName + '" salva com sucesso!');
        categoryNameInput.value = '';
        window.location.reload(); 
    });
}
const categoryList = document.querySelector('.category-list');
if (categoryList) {
    const categorias = JSON.parse(localStorage.getItem('listaDeCategorias')) || [];
    categoryList.innerHTML = ''; 
    if (categorias.length > 0) {
        categorias.forEach(categoria => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${categoria}</span>
                <button class="btn-action delete" data-name="${categoria}"><i class="fas fa-trash-alt"></i></button>
            `;
            categoryList.appendChild(li);
            const deleteButton = li.querySelector('.btn-action.delete');
            deleteButton.addEventListener('click', (event) => {
                event.preventDefault();
                const name = event.target.closest('.btn-action.delete').getAttribute('data-name');
                modalOverlay.dataset.name = name; 
                openModal();
            });
        });
    } else {
        categoryList.innerHTML = '<li><span>Nenhuma categoria cadastrada.</span></li>';
    }
}
const categorySelect = document.getElementById('categoria-produto');
if (categorySelect) {
    const categorias = JSON.parse(localStorage.getItem('listaDeCategorias')) || [];
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria; 
        option.textContent = categoria; 
        categorySelect.appendChild(option);
    });
}


/* * =====================================
 * LÓGICA DE FECHAMENTO DE CAIXA
 * =====================================
 */
const formFechamento = document.getElementById('form-fechamento');
const dataField = document.getElementById('data-fechamento');
if (dataField) {
    const hoje = new Date();
    dataField.value = hoje.toLocaleDateString('pt-BR'); 
}
if (formFechamento) {
    formFechamento.addEventListener('submit', function(event) {
        event.preventDefault();
        const dinheiro = parseFloat(document.getElementById('total-dinheiro').value) || 0;
        const cartao = parseFloat(document.getElementById('total-cartao').value) || 0;
        const pix = parseFloat(document.getElementById('total-pix').value) || 0;
        const totalVendaDia = dinheiro + cartao + pix;
        const data = dataField.value;
        const dataObj = new Date();
        const mesAtual = dataObj.getMonth();
        const anoAtual = dataObj.getFullYear();
        let fechamentos = JSON.parse(localStorage.getItem('listaDeFechamentos')) || [];
        
        const jaFechouHoje = fechamentos.some(f => f.data === data);
        if (jaFechouHoje) {
            alert('Erro: O caixa já foi fechado hoje! Só é permitido um fechamento por dia.');
            return;
        }
        const novoFechamento = { data, dinheiro: dinheiro.toFixed(2), cartao: cartao.toFixed(2), pix: pix.toFixed(2), total: totalVendaDia.toFixed(2) };
        fechamentos.push(novoFechamento);
        localStorage.setItem('listaDeFechamentos', JSON.stringify(fechamentos));
        
        let relatorioMensal = JSON.parse(localStorage.getItem('relatorioMensal')) || { mes: -1, ano: -1, total: 0 };
        if (relatorioMensal.mes !== mesAtual || relatorioMensal.ano !== anoAtual) {
            relatorioMensal.total = 0;
            relatorioMensal.mes = mesAtual;
            relatorioMensal.ano = anoAtual;
        }
        relatorioMensal.total += totalVendaDia;
        localStorage.setItem('relatorioMensal', JSON.stringify(relatorioMensal));
        logActivity('fas fa-wallet', 'yellow', 'Fechamento de Caixa', `Caixa fechado com R$ ${totalVendaDia.toFixed(2)}.`);
        alert('Fechamento do dia salvo com sucesso! Total: R$ ' + totalVendaDia.toFixed(2));
        window.location.href = 'dashboard.html';
    });
}

/* * =====================================
 * LÓGICA DE ATUALIZAR O DASHBOARD
 * =====================================
 */
const statsGrid = document.querySelector('.stats-grid');
if (statsGrid) {
    const produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
    const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
    if (totalProdutosCard) {
        totalProdutosCard.textContent = produtos.length;
    }
    const fechamentos = JSON.parse(localStorage.getItem('listaDeFechamentos')) || [];
    const vendasDiaCard = statsGrid.querySelector('.stat-icon.yellow').nextElementSibling.querySelector('strong');
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const fechamentoDeHoje = fechamentos.find(f => f.data === dataHoje);
    if (vendasDiaCard && fechamentoDeHoje) {
        vendasDiaCard.textContent = `R$ ${fechamentoDeHoje.total}`;
    } else if (vendasDiaCard) {
        vendasDiaCard.textContent = 'R$ 0,00';
    }
    const dataObj = new Date();
    const mesAtual = dataObj.getMonth();
    const anoAtual = dataObj.getFullYear();
    let relatorioMensal = JSON.parse(localStorage.getItem('relatorioMensal')) || { mes: -1, ano: -1, total: 0 };
    const valorVendasMesCard = statsGrid.querySelector('.stat-icon.blue').nextElementSibling.querySelector('strong');
    if (relatorioMensal.mes !== mesAtual || relatorioMensal.ano !== anoAtual) {
        valorVendasMesCard.textContent = 'R$ 0,00';
    } else {
        valorVendasMesCard.textContent = `R$ ${relatorioMensal.total.toFixed(2)}`;
    }
    const estoqueMinimoCard = statsGrid.querySelector('.stat-icon.red').nextElementSibling.querySelector('strong');
    if (estoqueMinimoCard) {
        const itensEstoqueBaixo = produtos.filter(p => (parseInt(p.qtd) || 0) <= (parseInt(p.estoqueMinimo) || 10));
        estoqueMinimoCard.textContent = itensEstoqueBaixo.length;
    }
    const activityFeedList = document.getElementById('activity-feed-list');
    if (activityFeedList) {
        const activities = JSON.parse(localStorage.getItem('listaDeAtividades')) || [];
        activityFeedList.innerHTML = ''; 
        if (activities.length > 0) {
            activities.forEach(act => {
                const li = document.createElement('li');
                li.className = 'feed-item';
                li.innerHTML = `
                    <div class="activity-icon ${act.color}">
                        <i class="${act.icon}"></i>
                    </div>
                    <div class="activity-details">
                        <strong>${act.title}</strong>
                        <span>${act.description}</span>
                    </div>
                    <span class="activity-time">${act.time}</span>
                `;
                activityFeedList.appendChild(li);
            });
        } else {
            activityFeedList.innerHTML = '<li class="feed-item"><span>Nenhuma atividade recente.</span></li>';
        }
    }
}


/* * =====================================
 * LÓGICA DE LISTAR RELATÓRIO DE VENDAS
 * =====================================
 */
const salesReportBody = document.getElementById('sales-report-body');
if (salesReportBody) {
    const fechamentos = JSON.parse(localStorage.getItem('listaDeFechamentos')) || [];
    salesReportBody.innerHTML = '';
    if (fechamentos.length > 0) {
        fechamentos.reverse().forEach(fechamento => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${fechamento.data}</strong></td>
                <td class="total-col">R$ ${fechamento.total}</td>
                <td>R$ ${fechamento.cartao}</td>
                <td>R$ ${fechamento.dinheiro}</td>
                <td>R$ ${fechamento.pix}</td>
            `;
            salesReportBody.appendChild(tr);
        });
    } else {
        salesReportBody.innerHTML = '<tr><td colspan="5">Nenhum fechamento de caixa registrado ainda.</td></tr>';
    }
}


/* * =====================================
 * LÓGICA DE AUTO-COMPLETAR (ENTRADA E SAÍDA)
 * =====================================
 */
const searchInput = document.getElementById('buscar-produto');
const suggestionsBox = document.getElementById('suggestions-box');
const skuSelecionadoInput = document.getElementById('produto-sku-selecionado');
const qtdAtualInput = document.getElementById('produto-qtd-atual');
const vencimentoSelecionadoInput = document.getElementById('produto-vencimento');

if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        const termoBusca = searchInput.value.toLowerCase();
        if (termoBusca.length < 1) {
            suggestionsBox.style.display = 'none';
            return;
        }
        const produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        const sugestoes = produtos.filter(p => 
            p.nome.toLowerCase().includes(termoBusca) || 
            p.sku.startsWith(termoBusca)
        );
        suggestionsBox.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `<strong>${p.nome}</strong> <small>SKU: ${p.sku} (Qtd: ${p.qtd})</small>`;
                item.addEventListener('click', () => {
                    searchInput.value = p.nome; 
                    skuSelecionadoInput.value = p.sku;
                    qtdAtualInput.value = p.qtd;
                    let dataFormatada = 'Sem vencimento';
                    if (p.vencimento) {
                        const partes = p.vencimento.split('-');
                        if(partes.length === 3) {
                            dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                        } else {
                            dataFormatada = p.vencimento; 
                        }
                    }
                    vencimentoSelecionadoInput.value = dataFormatada;
                    suggestionsBox.style.display = 'none';
                });
                suggestionsBox.appendChild(item);
            });
            suggestionsBox.style.display = 'block';
        } else {
            suggestionsBox.style.display = 'none';
        }
    });
}

/* * =====================================
 * LÓGICA DE SALVAR ENTRADA
 * =====================================
 */
const formEntrada = document.getElementById('form-add-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', (event) => {
        event.preventDefault();
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaAdicionar = parseInt(document.getElementById('quantidade').value) || 0;
        if (!skuParaAtualizar || quantidadeParaAdicionar <= 0) {
            alert('Erro: Você deve selecionar um produto da lista e inserir uma quantidade válida.');
            return;
        }
        let produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        const produtoIndex = produtos.findIndex(p => p.sku === skuParaAtualizar);
        if (produtoIndex > -1) {
            const qtdAntiga = parseInt(produtos[produtoIndex].qtd) || 0;
            produtos[produtoIndex].qtd = qtdAntiga + quantidadeParaAdicionar;
            localStorage.setItem('listaDeProdutos', JSON.stringify(produtos));
            const nomeProduto = produtos[produtoIndex].nome;
            logActivity('fas fa-arrow-down', 'green', 'Entrada de Estoque', `+${quantidadeParaAdicionar} unidades de "${nomeProduto}"`);
            alert(`Entrada registrada: +${quantidadeParaAdicionar} unidades de "${nomeProduto}".`);
            window.location.href = 'produtos.html'; 
        } else {
            alert('Erro: Produto selecionado não foi encontrado.');
        }
    });
}

/* * =====================================
 * LÓGICA DE REGISTRAR SAÍDA
 * =====================================
 */
const formSaida = document.getElementById('form-add-saida');
if (formSaida) {
    formSaida.addEventListener('submit', (event) => {
        event.preventDefault();
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaRemover = parseInt(document.getElementById('quantidade-saida').value) || 0;
        const motivo = document.getElementById('motivo-saida').value; 
        if (!skuParaAtualizar || quantidadeParaRemover <= 0) {
            alert('Erro: Você deve selecionar um produto da lista e inserir uma quantidade válida.');
            return;
        }
        let produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        const produtoIndex = produtos.findIndex(p => p.sku === skuParaAtualizar);
        if (produtoIndex > -1) {
            const produto = produtos[produtoIndex];
            const qtdAntiga = parseInt(produto.qtd) || 0;
            if (quantidadeParaRemover > qtdAntiga) {
                alert(`Erro: Você não pode remover ${quantidadeParaRemover} unidades. O estoque atual é de apenas ${qtdAntiga}.`);
                return;
            }
            produtos[produtoIndex].qtd = qtdAntiga - quantidadeParaRemover;
            localStorage.setItem('listaDeProdutos', JSON.stringify(produtos));
            let perdas = JSON.parse(localStorage.getItem('listaDePerdas')) || [];
            const novaPerda = {
                data: new Date().toLocaleDateString('pt-BR'),
                nome: produto.nome,
                sku: produto.sku,
                qtd: quantidadeParaRemover,
                motivo: motivo,
                custo: (parseFloat(produto.custo) || 0) * quantidadeParaRemover
            };
            perdas.push(novaPerda);
            localStorage.setItem('listaDePerdas', JSON.stringify(perdas));
            logActivity('fas fa-arrow-up', 'red', `Saída (${motivo})`, `-${quantidadeParaRemover} unidades de "${produto.nome}"`);
            alert(`Saída registrada: -${quantidadeParaRemover} unidades de "${produto.nome}".`);
            window.location.href = 'produtos.html'; 
        } else {
            alert('Erro: Produto selecionado não foi encontrado.');
        }
    });
}


/* * =====================================
 * LÓGICAS DOS RELATÓRIOS DE ESTOQUE
 * =====================================
 */
const stockLowReportBody = document.getElementById('stock-low-report-body');
if (stockLowReportBody) {
    const produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
    stockLowReportBody.innerHTML = ''; 
    const itensEstoqueBaixo = produtos.filter(p => 
        (parseInt(p.qtd) || 0) <= (parseInt(p.estoqueMinimo) || 10)
    );
    if (itensEstoqueBaixo.length > 0) {
        itensEstoqueBaixo.forEach(produto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.sku}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td><span class="stock-low">${produto.qtd}</span></td>
                <td>${produto.estoqueMinimo || 10}</td>
            `;
            stockLowReportBody.appendChild(tr);
        });
    } else {
        stockLowReportBody.innerHTML = '<tr><td colspan="5">Nenhum item com estoque baixo.</td></tr>';
    }
}
const inventoryReportBody = document.getElementById('inventory-report-body');
if (inventoryReportBody) {
    const produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
    inventoryReportBody.innerHTML = '';
    let grandTotal = 0; 
    if (produtos.length > 0) {
        produtos.forEach(produto => {
            const qtd = parseInt(produto.qtd) || 0;
            const custo = parseFloat(produto.custo) || 0;
            const itemTotal = qtd * custo; 
            grandTotal += itemTotal; 
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.nome}</td>
                <td>${qtd}</td>
                <td>R$ ${custo.toFixed(2)}</td>
                <td class="total-col">R$ ${itemTotal.toFixed(2)}</td>
            `;
            inventoryReportBody.appendChild(tr);
        });
    } else {
        inventoryReportBody.innerHTML = '<tr><td colspan="4">Nenhum produto cadastrado.</td></tr>';
    }
    const totalFooter = document.getElementById('inventory-total-footer');
    if (totalFooter) {
        totalFooter.textContent = `R$ ${grandTotal.toFixed(2)}`;
    }
}
const lossesReportBody = document.getElementById('losses-report-body');
if (lossesReportBody) {
    const perdas = JSON.parse(localStorage.getItem('listaDePerdas')) || [];
    lossesReportBody.innerHTML = '';
    let totalPerdas = 0;
    if (perdas.length > 0) {
        perdas.reverse().forEach(perda => {
            const custoPerda = parseFloat(perda.custo) || 0;
            totalPerdas += custoPerda;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${perda.data}</td>
                <td>${perda.nome}</td>
                <td>${perda.qtd}</td>
                <td>${perda.motivo}</td>
                <td class="stock-low">R$ ${custoPerda.toFixed(2)}</td>
            `;
            lossesReportBody.appendChild(tr);
        });
    } else {
        lossesReportBody.innerHTML = '<tr><td colspan="5">Nenhum registro de perda ou ajuste.</td></tr>';
    }
    const totalLossesFooter = document.getElementById('losses-total-footer');
    if (totalLossesFooter) {
        totalLossesFooter.textContent = `R$ ${totalPerdas.toFixed(2)}`;
    }
}


/* * =====================================
 * TAREFA 14: LÓGICA DE EDITAR PRODUTO
 * =====================================
 */
const formEditProduct = document.getElementById('form-edit-product');
if (formEditProduct) {
    
    // 1. PEGAR O SKU DA URL E PREENCHER O FORMULÁRIO
    const urlParams = new URLSearchParams(window.location.search);
    const skuParaEditar = urlParams.get('sku');
    
    if (skuParaEditar) {
        let produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        const produtoParaEditar = produtos.find(p => p.sku === skuParaEditar);
        if (produtoParaEditar) {
            document.getElementById('nome-produto').value = produtoParaEditar.nome;
            document.getElementById('sku-produto').value = produtoParaEditar.sku;
            document.getElementById('categoria-produto').value = produtoParaEditar.categoria;
            document.getElementById('preco-custo').value = produtoParaEditar.custo;
            document.getElementById('preco-venda').value = produtoParaEditar.venda;
            document.getElementById('qtd-inicial').value = produtoParaEditar.qtd;
            document.getElementById('data-vencimento').value = produtoParaEditar.vencimento;
            document.getElementById('estoque-minimo').value = produtoParaEditar.estoqueMinimo;
        } else {
            alert('Erro: Produto não encontrado.');
            window.location.href = 'produtos.html';
        }
    } else {
        alert('Erro: SKU não fornecido.');
        window.location.href = 'produtos.html';
    }

    // 2. LÓGICA PARA SALVAR AS ALTERAÇÕES
    formEditProduct.addEventListener('submit', function(event) {
        event.preventDefault();
        const nomeAtualizado = document.getElementById('nome-produto').value;
        const skuAtualizado = document.getElementById('sku-produto').value;
        const categoriaAtualizada = document.getElementById('categoria-produto').value;
        const custoAtualizado = parseFloat(document.getElementById('preco-custo').value) || 0;
        const vendaAtualizada = parseFloat(document.getElementById('preco-venda').value) || 0;
        const qtdAtualizada = parseInt(document.getElementById('qtd-inicial').value) || 0;
        const vencimentoAtualizado = document.getElementById('data-vencimento').value;
        const estoqueMinimoAtualizado = parseInt(document.getElementById('estoque-minimo').value) || 10;
        const produtoAtualizado = {
            nome: nomeAtualizado,
            sku: skuAtualizado,
            categoria: categoriaAtualizada,
            custo: custoAtualizado,
            venda: vendaAtualizada,
            qtd: qtdAtualizada,
            vencimento: vencimentoAtualizado,
            estoqueMinimo: estoqueMinimoAtualizado
        };
        let produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        const produtoIndex = produtos.findIndex(p => p.sku === skuAtualizado);
        if (produtoIndex > -1) {
            produtos[produtoIndex] = produtoAtualizado;
            localStorage.setItem('listaDeProdutos', JSON.stringify(produtos));
            logActivity('fas fa-pencil-alt', 'blue', 'Produto Editado', `"${nomeAtualizado}" (SKU: ${skuAtualizado}) foi atualizado.`);
            alert('Produto atualizado com sucesso!');
            window.location.href = 'produtos.html';
        } else {
            alert('Erro ao salvar: Produto não encontrado.');
        }
    });
}

/* * =====================================
 * TAREFA 15: LÓGICA DE CONFIGURAÇÕES
 * =====================================
 */
const formConfigMercado = document.getElementById('form-config-mercado');
if (formConfigMercado) {
    const config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    document.getElementById('nome-completo').value = config.nomeAdmin || 'Admin';
    document.getElementById('email').value = config.emailAdmin || 'admin@mercadobomd.com';
    document.getElementById('nome-mercado').value = config.nomeMercado || 'Mercado BOM D+';
    document.getElementById('cnpj').value = config.cnpj || '';
    document.getElementById('estoque-minimo').value = config.estoqueMinimoPadrao || 10;
    const profilePicPreview = document.getElementById('profile-pic-preview');
    if (config.profilePic) {
        profilePicPreview.src = config.profilePic;
    }
}
const profilePicInput = document.getElementById('profile-pic-input');
if (profilePicInput) {
    profilePicInput.addEventListener('change', function(event) {
        const file = event.target.files[0]; 
        if (file) {
            const reader = new FileReader(); 
            reader.onloadend = function() {
                document.getElementById('profile-pic-preview').src = reader.result;
            }
            reader.readAsDataURL(file);
        }
    });
}
const formMeuPerfil = document.getElementById('form-meu-perfil');
if (formMeuPerfil) {
    formMeuPerfil.addEventListener('submit', function(event) {
        event.preventDefault();
        let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
        config.nomeAdmin = document.getElementById('nome-completo').value;
        config.emailAdmin = document.getElementById('email').value;
        config.profilePic = document.getElementById('profile-pic-preview').src;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        alert('Perfil salvo com sucesso!');
        logActivity('fas fa-user-cog', 'gray', 'Perfil Atualizado', 'Os dados de "Meu Perfil" foram salvos.');
        carregarDadosGlobaisUsuario();
    });
}
if (formConfigMercado) {
    formConfigMercado.addEventListener('submit', function(event) {
        event.preventDefault();
        let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
        config.nomeMercado = document.getElementById('nome-mercado').value;
        config.cnpj = document.getElementById('cnpj').value;
        config.estoqueMinimoPadrao = document.getElementById('estoque-minimo').value;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        alert('Configurações do Mercado salvas com sucesso!');
        logActivity('fas fa-store', 'gray', 'Configurações Salvas', 'As configurações do mercado foram atualizadas.');
    });
}
const formAlterarSenha = document.getElementById('form-alterar-senha');
if (formAlterarSenha) {
    formAlterarSenha.addEventListener('submit', function(event) {
        event.preventDefault();
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmaSenha = document.getElementById('confirma-senha').value;
        if (!novaSenha || !confirmaSenha) {
            alert('Por favor, preencha os campos de nova senha e confirmação.');
            return;
        }
        if (novaSenha !== confirmaSenha) {
            alert('Erro: As novas senhas não conferem!');
            return;
        }
        alert('Senha alterada com sucesso! (Simulação)');
        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirma-senha').value = '';
    });
}
const btnLimparSistema = document.getElementById('btn-limpar-sistema');
if (btnLimparSistema) {
    btnLimparSistema.addEventListener('click', function() {
        if (confirm('ATENÇÃO: Você tem certeza que deseja limpar o sistema?')) {
            if (confirm('CONFIRMAÇÃO FINAL: Esta ação é irreversível e apagará TODOS os produtos, categorias e relatórios. Continuar?')) {
                localStorage.clear();
                alert('Sistema limpo. Você será redirecionado para a tela de login.');
                window.location.href = 'login.html';
            }
        }
    });
}

/* * =====================================
 * TAREFA 16: LÓGICA DE FILTRO DE PRODUTOS
 * =====================================
 */
const filtroBuscaInput = document.getElementById('filtro-busca');
const filtroCategoriaSelect = document.getElementById('filtro-categoria');

// Função principal que aplica os filtros
function aplicarFiltrosDeProduto() {
    // Esta verificação garante que a função só rode na página de produtos
    if (!productTableBody) return; 

    const todosProdutos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
    
    // Garantimos que os inputs existem antes de pegar o .value
    const termoBusca = filtroBuscaInput ? filtroBuscaInput.value.toLowerCase() : '';
    const categoriaSelecionada = filtroCategoriaSelect ? filtroCategoriaSelect.value : '';

    // Filtra a lista
    const produtosFiltrados = todosProdutos.filter(produto => {
        const matchBusca = produto.nome.toLowerCase().includes(termoBusca) || 
                           produto.sku.toLowerCase().includes(termoBusca);
        const matchCategoria = (categoriaSelecionada === "") || (produto.categoria === categoriaSelecionada);
        return matchBusca && matchCategoria;
    });

    // Renderiza a tabela apenas com os produtos filtrados
    renderProductTable(produtosFiltrados);
}

// Verifica se estamos na página de produtos (pois os filtros só existem lá)
if (filtroBuscaInput) {
    // 1. Preenche o dropdown de categorias
    const categorias = JSON.parse(localStorage.getItem('listaDeCategorias')) || [];
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria; 
        option.textContent = categoria; 
        filtroCategoriaSelect.appendChild(option);
    });

    // 2. Adiciona os "escutadores" para filtrar em tempo real
    filtroBuscaInput.addEventListener('keyup', aplicarFiltrosDeProduto);
    filtroCategoriaSelect.addEventListener('change', aplicarFiltrosDeProduto);
}


/* * =====================================
 * TAREFA 17: LÓGICA DA PESQUISA GLOBAL
 * =====================================
 */

// 1. Define as páginas do seu site
const paginasDoSite = [
    { nome: 'Dashboard', href: 'dashboard.html', icone: 'fas fa-home' },
    { nome: 'Produtos', href: 'produtos.html', icone: 'fas fa-box' },
    { nome: 'Adicionar Produto', href: 'adicionar-produto.html', icone: 'fas fa-plus-circle' },
    { nome: 'Categorias', href: 'categorias.html', icone: 'fas fa-tags' },
    { nome: 'Registrar Entrada', href: 'registrar-entrada.html', icone: 'fas fa-arrow-down' },
    { nome: 'Registrar Perda/Ajuste', href: 'registrar-saida.html', icone: 'fas fa-arrow-up' },
    { nome: 'Fechar Caixa (Vendas)', href: 'fechamento-caixa.html', icone: 'fas fa-wallet' },
    { nome: 'Relatórios de Vendas', href: 'relatorios-vendas.html', icone: 'fas fa-chart-bar' },
    { nome: 'Relatório: Estoque Baixo', href: 'relatorios-estoque-baixo.html', icone: 'fas fa-exclamation-triangle' },
    { nome: 'Relatório: Inventário', href: 'relatorios-inventario.html', icone: 'fas fa-dollar-sign' },
    { nome: 'Relatório: Perdas', href: 'relatorios-perdas.html', icone: 'fas fa-arrow-down' },
    { nome: 'Configurações', href: 'configuracoes.html', icone: 'fas fa-cog' }
];

const globalSearchInput = document.getElementById('global-search-input');
const globalSearchResults = document.getElementById('global-search-results');

if (globalSearchInput) {
    globalSearchInput.addEventListener('keyup', function(event) {
        const termoBusca = globalSearchInput.value.toLowerCase();
        
        if (termoBusca.length < 2) {
            globalSearchResults.style.display = 'none';
            return;
        }

        // Filtra a lista de PÁGINAS
        const sugestoes = paginasDoSite.filter(p => 
            p.nome.toLowerCase().includes(termoBusca)
        );

        globalSearchResults.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item'; // Reutiliza o mesmo estilo
                item.innerHTML = `<i class="${p.icone}" style="margin-right: 8px;"></i> ${p.nome}`;
                
                // Adiciona o clique para navegar
                item.addEventListener('click', () => {
                    window.location.href = p.href;
                });
                
                globalSearchResults.appendChild(item);
            });
            globalSearchResults.style.display = 'block';
        } else {
            globalSearchResults.style.display = 'none';
        }
    });

    // Opcional: Esconde as sugestões se clicar fora
    document.addEventListener('click', function(event) {
        // Verifica se o clique foi FORA da barra de pesquisa
        if (!event.target.closest('.search-bar')) {
            globalSearchResults.style.display = 'none';
        }
    });
}