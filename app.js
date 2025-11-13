/* === app.js === */
/* (ATENÇÃO: Este arquivo é do FRONT-END) */
/* (Agora ele usa fetch() para chamar o Back-end em http://localhost:3000) */

// Define o "endereço" do seu back-end
const API_URL = 'http://localhost:3000';

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
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        // (No futuro, vamos trocar isso para chamar a API de login)
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
// (Esta lógica de salvar no localStorage continua a mesma, por enquanto)
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
 * LÓGICA DO MODAL DE CONFIRMAÇÃO (ATUALIZADO)
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

    // AGORA O "SIM, EXCLUIR" CHAMA A API
    modalBtnConfirm.addEventListener('click', async () => {
        const skuParaDeletar = modalOverlay.dataset.sku;
        const nomeParaDeletar = modalOverlay.dataset.name;

        if (skuParaDeletar) {
            // --- MUDANÇA AQUI ---
            try {
                const response = await fetch(`${API_URL}/produtos/${skuParaDeletar}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (response.ok) {
                    alert('Produto excluído com sucesso!');
                    logActivity('fas fa-trash-alt', 'red', 'Produto Excluído', `O produto (SKU: ${skuParaDeletar}) foi removido.`);
                    window.location.reload(); 
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                alert(`Erro ao deletar produto: ${error.message}`);
            }
            // --- FIM DA MUDANÇA ---

        } 
        else if (nomeParaDeletar) {
            // (Lógica de deletar categoria ainda usa localStorage)
            let categorias = JSON.parse(localStorage.getItem('listaDeCategorias')) || [];
            categorias = categorias.filter(c => c !== nomeParaDeletar);
            localStorage.setItem('listaDeCategorias', JSON.stringify(categorias));
            logActivity('fas fa-trash-alt', 'red', 'Categoria Excluída', `A categoria "${nomeParaDeletar}" foi removida.`);
            alert('Categoria excluída com sucesso!');
            window.location.reload(); 
        }
        
        closeModal();
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (CRIAR - ATUALIZADO)
 * =====================================
 */
const formAddProduct = document.getElementById('form-add-product');
if (formAddProduct) {
    formAddProduct.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        
        // Pega os dados do formulário
        const novoProduto = {
            nome: document.getElementById('nome-produto').value,
            sku: document.getElementById('sku-produto').value,
            categoria: document.getElementById('categoria-produto').value,
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value,
            estoqueMinimo: parseInt(document.getElementById('estoque-minimo').value) || 10
        };

        // --- MUDANÇA AQUI ---
        try {
            const response = await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoProduto) // Envia o objeto como JSON
            });
            const result = await response.json();

            if (response.status === 201) { // 201 = "Created"
                logActivity('fas fa-box', 'blue', 'Novo Produto Cadastrado', `"${novoProduto.nome}" foi adicionado ao sistema.`);
                alert('Produto "' + novoProduto.nome + '" cadastrado com sucesso!');
                window.location.href = 'produtos.html';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erro ao cadastrar produto: ${error.message}`);
        }
        // --- FIM DA MUDANÇA ---
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (LISTAR - ATUALIZADO)
 * =====================================
 */
const productTableBody = document.getElementById('product-table-body');

// (Esta função é nova, ela desenha a tabela)
function renderProductTable(produtosParaRenderizar) {
    const tabela = document.getElementById('product-table-body');
    if (!tabela) return;
    tabela.innerHTML = ''; 

    if (produtosParaRenderizar.length > 0) {
        produtosParaRenderizar.forEach(produto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.sku}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria_nome}</td> <td><span class="stock-ok">${produto.qtd}</span></td>
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
        tabela.innerHTML = '<tr><td colspan="6">Nenhum produto encontrado.</td></tr>';
    }
}

// (Esta lógica agora chama a API)
if (productTableBody) {
    // --- MUDANÇA AQUI ---
    async function carregarProdutos() {
        try {
            const response = await fetch(`${API_URL}/produtos`);
            const produtos = await response.json();
            
            // Salva uma cópia no localStorage para o filtro usar
            localStorage.setItem('listaDeProdutos', JSON.stringify(produtos)); 
            
            renderProductTable(produtos);
        } catch (error) {
            productTableBody.innerHTML = `<tr><td colspan="6">Erro ao carregar produtos: ${error.message}</td></tr>`;
        }
    }
    carregarProdutos();
    // --- FIM DA MUDANÇA ---
}


/* * =====================================
 * LÓGICA DE CATEGORIAS
 * =====================================
 */
// (Lógica de categorias ainda usa localStorage)
const formAddCategory = document.getElementById('form-add-categoria');
if (formAddCategory) {
    // ... (código de salvar categoria) ...
}
const categoryList = document.querySelector('.category-list');
if (categoryList) {
    // ... (código de listar categoria) ...
}
const categorySelect = document.getElementById('categoria-produto');
if (categorySelect) {
    // ... (código de preencher dropdown de categoria) ...
}


/* * =====================================
 * LÓGICA DE FECHAMENTO DE CAIXA
 * =====================================
 */
// (Esta lógica continua no localStorage por enquanto)
const formFechamento = document.getElementById('form-fechamento');
const dataField = document.getElementById('data-fechamento');
if (dataField) {
    // ... (código de preencher data) ...
}
if (formFechamento) {
    // ... (código de salvar fechamento) ...
}

/* * =====================================
 * LÓGICA DE ATUALIZAR O DASHBOARD (ATUALIZADO PARA API)
 * =====================================
 */
const statsGrid = document.querySelector('.stats-grid');
if (statsGrid) {
    
    // 1. Define uma função para carregar os dados
    async function carregarDashboard() {
        try {
            // 2. CHAMA A NOVA ROTA DO BACK-END
            const response = await fetch(`${API_URL}/dashboard-summary`);
            if (!response.ok) throw new Error('Falha ao carregar dados do dashboard.');
            
            const data = await response.json();

            // 3. Encontra os <strong> nos cards
            const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
            const vendasDiaCard = statsGrid.querySelector('.stat-icon.yellow').nextElementSibling.querySelector('strong');
            const valorVendasMesCard = statsGrid.querySelector('.stat-icon.blue').nextElementSibling.querySelector('strong');
            const estoqueMinimoCard = statsGrid.querySelector('.stat-icon.red').nextElementSibling.querySelector('strong');

            // 4. Preenche os cards com os dados REAIS do banco
            if (totalProdutosCard) totalProdutosCard.textContent = data.totalProdutos;
            if (vendasDiaCard) vendasDiaCard.textContent = `R$ ${data.vendasDoDia.toFixed(2)}`;
            if (valorVendasMesCard) valorVendasMesCard.textContent = `R$ ${data.vendasDoMes.toFixed(2)}`;
            if (estoqueMinimoCard) estoqueMinimoCard.textContent = data.totalEstoqueBaixo;

        } catch (error) {
            console.error("Erro no Dashboard:", error.message);
            // Mostra um erro em um dos cards se a API falhar
            const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
            if (totalProdutosCard) totalProdutosCard.textContent = "Erro!";
        }

        // 5. Carrega o Extrato de Atividades (que ainda usa localStorage)
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
    
    // 6. Chama a função para carregar tudo
    carregarDashboard();
}


/* * =====================================
 * LÓGICAS DOS RELATÓRIOS
 * =====================================
 */
// (Estas lógicas continuam lendo do localStorage por enquanto)
const salesReportBody = document.getElementById('sales-report-body');
if (salesReportBody) {
    // ... (código do relatório de vendas) ...
}
const stockLowReportBody = document.getElementById('stock-low-report-body');
if (stockLowReportBody) {
    // ... (código do relatório de estoque baixo) ...
}
const inventoryReportBody = document.getElementById('inventory-report-body');
if (inventoryReportBody) {
    // ... (código do relatório de inventário) ...
}
const lossesReportBody = document.getElementById('losses-report-body');
if (lossesReportBody) {
    // ... (código do relatório de perdas) ...
}


/* * =====================================
 * LÓGICA DE AUTO-COMPLETAR (ENTRADA E SAÍDA)
 * =====================================
 */
// (Esta lógica continua lendo do localStorage por enquanto)
const searchInput = document.getElementById('buscar-produto');
const suggestionsBox = document.getElementById('suggestions-box');
// ... (código do auto-completar) ...


/* * =====================================
 * LÓGICA DE SALVAR ENTRADA E SAÍDA
 * =====================================
 */
// (Estas lógicas ainda não chamam a API, vão chamar na próxima etapa)
const formEntrada = document.getElementById('form-add-entrada');
if (formEntrada) {
    // ... (código de salvar entrada) ...
}
const formSaida = document.getElementById('form-add-saida');
if (formSaida) {
    // ... (código de registrar saída) ...
}

/* * =====================================
 * TAREFA 14: LÓGICA DE EDITAR PRODUTO (ATUALIZADO)
 * =====================================
 */
const formEditProduct = document.getElementById('form-edit-product');
if (formEditProduct) {
    
    // 1. PEGAR O SKU DA URL E PREENCHER O FORMULÁRIO
    const urlParams = new URLSearchParams(window.location.search);
    const skuParaEditar = urlParams.get('sku');
    
    if (skuParaEditar) {
        // --- MUDANÇA AQUI: Busca os dados da API ---
        fetch(`${API_URL}/produtos`) 
            .then(res => res.json())
            .then(produtos => {
                const produtoParaEditar = produtos.find(p => p.sku === skuParaEditar);
                if (produtoParaEditar) {
                    document.getElementById('nome-produto').value = produtoParaEditar.nome;
                    document.getElementById('sku-produto').value = produtoParaEditar.sku;
                    document.getElementById('categoria-produto').value = produtoParaEditar.categoria_nome; 
                    document.getElementById('preco-custo').value = produtoParaEditar.custo;
                    document.getElementById('preco-venda').value = produtoParaEditar.venda;
                    document.getElementById('qtd-inicial').value = produtoParaEditar.qtd;
                    document.getElementById('data-vencimento').value = produtoParaEditar.vencimento ? produtoParaEditar.vencimento.split('T')[0] : '';
                    document.getElementById('estoque-minimo').value = produtoParaEditar.estoque_minimo;
                } else {
                    alert('Erro: Produto não encontrado.');
                    window.location.href = 'produtos.html';
                }
            });
        // --- FIM DA MUDANÇA ---
    } else {
        alert('Erro: SKU não fornecido.');
        window.location.href = 'produtos.html';
    }

    // 2. LÓGICA PARA SALVAR AS ALTERAÇÕES (CHAMANDO A API)
    formEditProduct.addEventListener('submit', async function(event) {
        event.preventDefault();

        const skuAtualizado = document.getElementById('sku-produto').value;
        const produtoAtualizado = {
            nome: document.getElementById('nome-produto').value,
            categoria: document.getElementById('categoria-produto').value,
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value,
            estoqueMinimo: parseInt(document.getElementById('estoque-minimo').value) || 10
        };

        // --- MUDANÇA AQUI ---
        try {
            const response = await fetch(`${API_URL}/produtos/${skuAtualizado}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoAtualizado)
            });
            const result = await response.json();

            if (response.ok) {
                logActivity('fas fa-pencil-alt', 'blue', 'Produto Editado', `"${produtoAtualizado.nome}" (SKU: ${skuAtualizado}) foi atualizado.`);
                alert('Produto atualizado com sucesso!');
                window.location.href = 'produtos.html';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
        // --- FIM DA MUDANÇA ---
    });
}

/* * =====================================
 * TAREFA 15: LÓGICA DE CONFIGURAÇÕES
 * =====================================
 */
// (Esta lógica continua no localStorage por enquanto)
const formConfigMercado = document.getElementById('form-config-mercado');
if (formConfigMercado) {
    // ... (código de carregar e salvar configurações) ...
}
// ... (etc) ...


/* * =====================================
 * TAREFA 16: LÓGICA DE FILTRO DE PRODUTOS
 * =====================================
 */
// (Lógica do filtro local ainda usa localStorage)
const filtroBuscaInput = document.getElementById('filtro-busca');
const filtroCategoriaSelect = document.getElementById('filtro-categoria');

function aplicarFiltrosDeProduto() {
    if (!productTableBody) return; 
    const todosProdutos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
    // ... (código de filtrar) ...
}

if (filtroBuscaInput) {
    // ... (código de preencher dropdown de filtro) ...
    filtroBuscaInput.addEventListener('keyup', aplicarFiltrosDeProduto);
    filtroCategoriaSelect.addEventListener('change', aplicarFiltrosDeProduto);
}


/* * =====================================
 * TAREFA 17: LÓGICA DA PESQUISA GLOBAL
 * =====================================
 */
// (Lógica da pesquisa global continua a mesma)
const globalSearchInput = document.getElementById('global-search-input');
if (globalSearchInput) {
    // ... (código da pesquisa global) ...
}