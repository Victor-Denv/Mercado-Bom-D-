/* === app.js === */
/* (Esta é a versão FINAL 100% conectada ao Back-end) */

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
            alert('Login bem-sucedido! Selecione seu perfil.');
            localStorage.setItem('userToken', 'admin-logado-12345'); 
            
            // --- MUDANÇA: Redireciona para PERFIS ---
            window.location.href = 'perfis.html';
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
            localStorage.removeItem('userToken'); // Limpa o token de login
            localStorage.removeItem('currentProfile'); // Limpa o perfil
            localStorage.removeItem(CONFIG_KEY); // Limpa a foto de perfil salva
            window.location.href = 'login.html';
        }
    });
}

/* * =====================================
 * TAREFA 18: LÓGICA DE REGISTRO DE ATIVIDADES (ATUALIZADO)
 * =====================================
 */
async function logActivity(icon, color, title, description) {
    try {
        // 1. Pega o perfil que está logado
        const perfil = localStorage.getItem('currentProfile') || 'Sistema'; 
        
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // 2. Adiciona o nome do perfil no "malote"
        const newActivity = { icon, color, title, description, time, perfil_nome: perfil }; 

        await fetch(`${API_URL}/atividades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newActivity) // 3. Envia para o back-end
        });
    } catch (error) {
        console.error('Falha ao registrar atividade:', error.message);
    }
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
        modalOverlay.removeAttribute('data-id'); 
    }
}

if (modalOverlay) {
    modalBtnCancel.addEventListener('click', closeModal);
    modalCloseIcon.addEventListener('click', closeModal);

    modalBtnConfirm.addEventListener('click', async () => {
        const skuParaDeletar = modalOverlay.dataset.sku;
        const idParaDeletar = modalOverlay.dataset.id; 

        if (skuParaDeletar) {
            try {
                const prodResponse = await fetch(`${API_URL}/produtos`);
                const produtos = await prodResponse.json();
                const produtoDeletado = produtos.find(p => p.sku === skuParaDeletar);

                const response = await fetch(`${API_URL}/produtos/${skuParaDeletar}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                
                if(produtoDeletado) {
                    await logActivity('fas fa-trash-alt', 'red', 'Produto Excluído', `O produto "${produtoDeletado.nome}" foi removido.`);
                }
                alert('Produto excluído com sucesso!');
                window.location.reload(); 
            } catch (error) {
                alert(`Erro ao deletar produto: ${error.message}`);
            }

        } 
        else if (idParaDeletar) {
            try {
                const catResponse = await fetch(`${API_URL}/categorias`);
                const categorias = await catResponse.json();
                const categoriaDeletada = categorias.find(c => c.id == idParaDeletar);

                const response = await fetch(`${API_URL}/categorias/${idParaDeletar}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                
                if (categoriaDeletada) {
                    await logActivity('fas fa-trash-alt', 'red', 'Categoria Excluída', `A categoria "${categoriaDeletada.nome}" foi removida.`);
                }
                alert('Categoria excluída com sucesso!');
                window.location.reload(); 
            } catch (error) {
                alert(`Erro ao deletar categoria: ${error.message}`);
            }
        }
        
        closeModal();
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (CRIAR)
 * =====================================
 */
const formAddProduct = document.getElementById('form-add-product');
if (formAddProduct) {
    formAddProduct.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        
        const novoProduto = {
            nome: document.getElementById('nome-produto').value,
            sku: document.getElementById('sku-produto').value,
            categoria: document.getElementById('categoria-produto').value,
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value || null,
            estoqueMinimo: parseInt(document.getElementById('estoque-minimo').value) || 10
        };

        try {
            const response = await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoProduto) 
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            await logActivity('fas fa-box', 'blue', 'Novo Produto Cadastrado', `"${novoProduto.nome}" foi adicionado ao sistema.`);
            alert('Produto "' + novoProduto.nome + '" cadastrado com sucesso!');
            window.location.href = 'produtos.html';
        } catch (error) {
            alert(`Erro ao cadastrar produto: ${error.message}`);
        }
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (LISTAR)
 * =====================================
 */
const productTableBody = document.getElementById('product-table-body');
let cacheProdutos = []; 

function renderProductTable(produtosParaRenderizar) {
    const tabela = document.getElementById('product-table-body');
    if (!tabela) return;
    tabela.innerHTML = ''; 

    if (produtosParaRenderizar.length > 0) {
        produtosParaRenderizar.forEach(produto => {
            const tr = document.createElement('tr');
            const precoVenda = parseFloat(produto.venda) || 0;
            tr.innerHTML = `
                <td>${produto.sku}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria_nome}</td> 
                <td><span class="stock-ok">${produto.qtd}</span></td>
                <td>R$ ${precoVenda.toFixed(2)}</td> 
                <td>
                    <button class="btn-action edit" data-sku="${produto.sku}">Editar</button>
                    <button class="btn-action delete" data-sku="${produto.sku}">Excluir</button>
                </td>
            `;
            tabela.appendChild(tr);

            const deleteButton = tr.querySelector('.btn-action.delete');
            deleteButton.addEventListener('click', (event) => {
                event.preventDefault();
                const sku = event.target.closest('.btn-action.delete').getAttribute('data-sku');
                modalOverlay.dataset.sku = sku; 
                openModal();
            });
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

if (productTableBody) {
    async function carregarProdutos() {
        try {
            const response = await fetch(`${API_URL}/produtos`);
            cacheProdutos = await response.json(); 
            renderProductTable(cacheProdutos);
        } catch (error) {
            productTableBody.innerHTML = `<tr><td colspan="6">Erro ao carregar produtos: ${error.message}</td></tr>`;
        }
    }
    carregarProdutos();
}


/* * =====================================
 * LÓGICA DE CATEGORIAS
 * =====================================
 */
const formAddCategory = document.getElementById('form-add-categoria');
if (formAddCategory) {
    formAddCategory.addEventListener('submit', async function(event) {
        event.preventDefault();
        const categoryNameInput = document.getElementById('nome-categoria');
        const categoryName = categoryNameInput.value;
        if (!categoryName) {
            alert('Por favor, digite o nome da categoria.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/categorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: categoryName })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            await logActivity('fas fa-tags', 'gray', 'Nova Categoria Adicionada', `A categoria "${categoryName}" foi criada.`);
            alert('Categoria "' + categoryName + '" salva com sucesso!');
            window.location.reload(); 
        } catch (error) {
            alert(`Erro ao salvar categoria: ${error.message}`);
        }
    });
}
const categoryList = document.querySelector('.category-list');
if (categoryList) {
    async function carregarCategorias() {
        try {
            const response = await fetch(`${API_URL}/categorias`);
            const categorias = await response.json();
            
            categoryList.innerHTML = ''; 
            if (categorias.length > 0) {
                categorias.forEach(categoria => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${categoria.nome}</span>
                        <button class="btn-action delete" data-id="${categoria.id}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    categoryList.appendChild(li);
                    
                    const deleteButton = li.querySelector('.btn-action.delete');
                    deleteButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        const id = event.target.closest('.btn-action.delete').getAttribute('data-id');
                        modalOverlay.dataset.id = id; 
                        openModal();
                    });
                });
            } else {
                categoryList.innerHTML = '<li><span>Nenhuma categoria cadastrada.</span></li>';
            }
        } catch (error) {
             categoryList.innerHTML = `<li><span>Erro ao carregar: ${error.message}</span></li>`;
        }
    }
    carregarCategorias();
}
const categorySelect = document.getElementById('categoria-produto');
if (categorySelect) {
    async function carregarDropdownCategorias() {
        try {
            const response = await fetch(`${API_URL}/categorias`);
            const categorias = await response.json();
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.nome; 
                option.textContent = categoria.nome; 
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar categorias no dropdown:", error.message);
        }
    }
    carregarDropdownCategorias();
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
    formFechamento.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const dataObj = new Date();
        const fechamento = {
            dinheiro: parseFloat(document.getElementById('total-dinheiro').value) || 0,
            cartao: parseFloat(document.getElementById('total-cartao').value) || 0,
            pix: parseFloat(document.getElementById('total-pix').value) || 0,
            data: dataField.value,
            mes: dataObj.getMonth() + 1,
            ano: dataObj.getFullYear()
        };
        fechamento.total = fechamento.dinheiro + fechamento.cartao + fechamento.pix;

        try {
            const response = await fetch(`${API_URL}/fechamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fechamento)
            });
            const result = await response.json();
            
            if (response.status === 409) { 
                alert('Erro: O caixa já foi fechado hoje!');
                return;
            }
            if (!response.ok) throw new Error(result.error);
            
            await logActivity('fas fa-wallet', 'yellow', 'Fechamento de Caixa', `Caixa fechado com R$ ${fechamento.total.toFixed(2)}.`);
            alert('Fechamento do dia salvo com sucesso! Total: R$ ' + fechamento.total.toFixed(2));
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert(`Erro ao salvar fechamento: ${error.message}`);
        }
    });
}

/* * =====================================
 * LÓGICA DE ATUALIZAR O DASHBOARD
 * =====================================
 */
const statsGrid = document.querySelector('.stats-grid');
if (statsGrid) {
    
    async function carregarDashboard() {
        try {
            // 1. Carrega os números dos cards
            const response = await fetch(`${API_URL}/dashboard-summary`);
            if (!response.ok) throw new Error('Falha ao carregar dados do dashboard.');
            const data = await response.json();

            const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
            const vendasDiaCard = statsGrid.querySelector('.stat-icon.yellow').nextElementSibling.querySelector('strong');
            const valorVendasMesCard = statsGrid.querySelector('.stat-icon.blue').nextElementSibling.querySelector('strong');
            const estoqueMinimoCard = statsGrid.querySelector('.stat-icon.red').nextElementSibling.querySelector('strong');

            if (totalProdutosCard) totalProdutosCard.textContent = data.totalProdutos;
            if (vendasDiaCard) vendasDiaCard.textContent = `R$ ${data.vendasDoDia.toFixed(2)}`;
            if (valorVendasMesCard) valorVendasMesCard.textContent = `R$ ${data.vendasDoMes.toFixed(2)}`;
            if (estoqueMinimoCard) estoqueMinimoCard.textContent = data.totalEstoqueBaixo;

        } catch (error) {
            console.error("Erro no Dashboard:", error.message);
            const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
            if (totalProdutosCard) totalProdutosCard.textContent = "Erro!";
        }

        // 2. Carrega o Extrato de Atividades
        const activityFeedList = document.getElementById('activity-feed-list');
        if (activityFeedList) {
            try {
                const response = await fetch(`${API_URL}/atividades`);
                const activities = await response.json();
                
                activityFeedList.innerHTML = ''; 
                if (activities.length > 0) {
                    activities.forEach(act => {
                        const li = document.createElement('li');
                        li.className = 'feed-item';
                        // ATUALIZADO: Mostra o nome do perfil
                        li.innerHTML = `
                            <div class="activity-icon ${act.color}">
                                <i class="${act.icon}"></i>
                            </div>
                            <div class="activity-details">
                                <strong>${act.perfil_nome}</strong>
                                <span>${act.description}</span>
                            </div>
                            <span class="activity-time">${act.time_string}</span>
                        `;
                        activityFeedList.appendChild(li);
                    });
                } else {
                    activityFeedList.innerHTML = '<li class="feed-item"><span>Nenhuma atividade recente.</span></li>';
                }
            } catch (error) {
                activityFeedList.innerHTML = '<li class="feed-item"><span>Erro ao carregar atividades.</span></li>';
            }
        }
    }
    carregarDashboard();
}


/* * =====================================
 * LÓGICAS DOS RELATÓRIOS
 * =====================================
 */
const salesReportBody = document.getElementById('sales-report-body');
if (salesReportBody) {
    async function carregarRelatorioVendas() {
        try {
            const response = await fetch(`${API_URL}/fechamentos`);
            const fechamentos = await response.json();
            salesReportBody.innerHTML = '';
            if (fechamentos.length > 0) {
                fechamentos.forEach(fechamento => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fechamento.data_fechamento}</strong></td>
                        <td class="total-col">R$ ${parseFloat(fechamento.total).toFixed(2)}</td>
                        <td>R$ ${parseFloat(fechamento.cartao).toFixed(2)}</td>
                        <td>R$ ${parseFloat(fechamento.dinheiro).toFixed(2)}</td>
                        <td>R$ ${parseFloat(fechamento.pix).toFixed(2)}</td>
                    `;
                    salesReportBody.appendChild(tr);
                });
            } else {
                salesReportBody.innerHTML = '<tr><td colspan="5">Nenhum fechamento de caixa registrado ainda.</td></tr>';
            }
        } catch (error) {
            salesReportBody.innerHTML = `<tr><td colspan="5">Erro ao carregar: ${error.message}</td></tr>`;
        }
    }
    carregarRelatorioVendas();
}

const stockLowReportBody = document.getElementById('stock-low-report-body');
if (stockLowReportBody) {
    async function carregarEstoqueBaixo() {
        try {
            const response = await fetch(`${API_URL}/relatorios/estoque-baixo`);
            const itens = await response.json();
            stockLowReportBody.innerHTML = '';
            if (itens.length > 0) {
                itens.forEach(produto => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${produto.sku}</td>
                        <td>${produto.nome}</td>
                        <td>${produto.categoria_nome}</td>
                        <td><span class="stock-low">${produto.qtd}</span></td>
                        <td>${produto.estoque_minimo}</td>
                    `;
                    stockLowReportBody.appendChild(tr);
                });
            } else {
                stockLowReportBody.innerHTML = '<tr><td colspan="5">Nenhum item com estoque baixo.</td></tr>';
            }
        } catch (error) {
            stockLowReportBody.innerHTML = `<tr><td colspan="5">Erro ao carregar: ${error.message}</td></tr>`;
        }
    }
    carregarEstoqueBaixo();
}

const inventoryReportBody = document.getElementById('inventory-report-body');
if (inventoryReportBody) {
    async function carregarInventario() {
        try {
            const response = await fetch(`${API_URL}/relatorios/inventario`);
            const itens = await response.json();
            inventoryReportBody.innerHTML = '';
            let grandTotal = 0;
            if (itens.length > 0) {
                itens.forEach(produto => {
                    const itemTotal = parseFloat(produto.custo_total) || 0;
                    grandTotal += itemTotal;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${produto.nome}</td>
                        <td>${produto.qtd}</td>
                        <td>R$ ${parseFloat(produto.custo).toFixed(2)}</td>
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
        } catch (error) {
            inventoryReportBody.innerHTML = `<tr><td colspan="4">Erro ao carregar: ${error.message}</td></tr>`;
        }
    }
    carregarInventario();
}

const lossesReportBody = document.getElementById('losses-report-body');
if (lossesReportBody) {
    async function carregarPerdas() {
        try {
            const response = await fetch(`${API_URL}/relatorios/perdas`);
            const perdas = await response.json();
            lossesReportBody.innerHTML = '';
            let totalPerdas = 0;
            if (perdas.length > 0) {
                perdas.forEach(perda => {
                    const custoPerda = parseFloat(perda.custo_total) || 0;
                    totalPerdas += custoPerda;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${perda.data_perda}</td>
                        <td>${perda.nome_produto}</td>
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
        } catch (error) {
            lossesReportBody.innerHTML = `<tr><td colspan="5">Erro ao carregar: ${error.message}</td></tr>`;
        }
    }
    carregarPerdas();
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
    let cacheProdutosAutocomplete = []; 
    
    searchInput.addEventListener('focus', async () => {
        if (cacheProdutosAutocomplete.length === 0) {
            try {
                const response = await fetch(`${API_URL}/produtos`);
                cacheProdutosAutocomplete = await response.json();
            } catch (e) { console.error("Falha ao buscar produtos para autocomplete"); }
        }
    });

    searchInput.addEventListener('keyup', (e) => {
        const termoBusca = searchInput.value.toLowerCase();
        if (termoBusca.length < 1) {
            suggestionsBox.style.display = 'none';
            return;
        }
        
        const sugestoes = cacheProdutosAutocomplete.filter(p => 
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
                        const partes = p.vencimento.split('T')[0].split('-');
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
 * TAREFA 7: LÓGICA DE SALVAR ENTRADA
 * =====================================
 */
const formEntrada = document.getElementById('form-add-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', async (event) => {
        event.preventDefault();
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaAdicionar = parseInt(document.getElementById('quantidade').value) || 0;
        if (!skuParaAtualizar || quantidadeParaAdicionar <= 0) {
            alert('Erro: Você deve selecionar um produto da lista e inserir uma quantidade válida.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/estoque/entrada`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: skuParaAtualizar,
                    quantidade: quantidadeParaAdicionar
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            await logActivity('fas fa-arrow-down', 'green', 'Entrada de Estoque', `+${quantidadeParaAdicionar} unidades (SKU: ${skuParaAtualizar})`);
            alert(`Entrada registrada com sucesso!`);
            window.location.href = 'produtos.html'; 
        } catch (error) {
            alert(`Erro ao registrar entrada: ${error.message}`);
        }
    });
}

/* * =====================================
 * TAREFA 8: LÓGICA DE REGISTRAR SAÍDA
 * =====================================
 */
const formSaida = document.getElementById('form-add-saida');
if (formSaida) {
    formSaida.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaRemover = parseInt(document.getElementById('quantidade-saida').value) || 0;
        const motivo = document.getElementById('motivo-saida').value; 

        if (!skuParaAtualizar || quantidadeParaRemover <= 0) {
            alert('Erro: Você deve selecionar um produto da lista e inserir uma quantidade válida.');
            return;
        }

        const produtos = JSON.parse(localStorage.getItem('listaDeProdutos')) || [];
        const produto = produtos.find(p => p.sku === skuParaAtualizar);

        if (!produto) {
             alert('Erro: Produto selecionado não foi encontrado.');
             return;
        }
        
        const qtdAntiga = parseInt(produto.qtd) || 0;
        if (quantidadeParaRemover > qtdAntiga) {
            alert(`Erro: Você não pode remover ${quantidadeParaRemover} unidades. O estoque atual é de apenas ${qtdAntiga}.`);
            return;
        }

        const custoTotal = (parseFloat(produto.custo) || 0) * quantidadeParaRemover;

        try {
            const response = await fetch(`${API_URL}/estoque/saida`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku: skuParaAtualizar,
                    quantidade: quantidadeParaRemover,
                    motivo: motivo,
                    nomeProduto: produto.nome,
                    custoTotal: custoTotal
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            await logActivity('fas fa-arrow-up', 'red', `Saída (${motivo})`, `-${quantidadeParaRemover} unidades de "${produto.nome}"`);
            alert(`Saída registrada com sucesso!`);
            window.location.href = 'produtos.html'; 
        } catch (error) {
            alert(`Erro ao registrar saída: ${error.message}`);
        }
    });
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
        async function carregarProdutoParaEditar() {
            try {
                const response = await fetch(`${API_URL}/produtos`);
                const produtos = await response.json();
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
            } catch (error) {
                alert('Erro ao carregar dados do produto.');
            }
        }
        carregarProdutoParaEditar();
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
            vencimento: document.getElementById('data-vencimento').value || null,
            estoqueMinimo: parseInt(document.getElementById('estoque-minimo').value) || 10
        };

        try {
            const response = await fetch(`${API_URL}/produtos/${skuAtualizado}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoAtualizado)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            await logActivity('fas fa-pencil-alt', 'blue', 'Produto Editado', `"${produtoAtualizado.nome}" (SKU: ${skuAtualizado}) foi atualizado.`);
            alert('Produto atualizado com sucesso!');
            window.location.href = 'produtos.html';
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    });
}

/* * =====================================
 * TAREFA 15: LÓGICA DE CONFIGURAÇÕES
 * =====================================
 */
const formConfigMercado = document.getElementById('form-config-mercado');
if (formConfigMercado) {
    // 1. Carregar os dados
    async function carregarConfiguracoes() {
        try {
            const response = await fetch(`${API_URL}/configuracoes`);
            const config = await response.json();
            
            if (config.admin) {
                document.getElementById('nome-completo').value = config.admin.nome || 'Admin';
                document.getElementById('email').value = config.admin.email || 'admin@mercadobomd.com';
                if(config.admin.foto_perfil) {
                    document.getElementById('profile-pic-preview').src = config.admin.foto_perfil;
                    localStorage.setItem(CONFIG_KEY, JSON.stringify({ profilePic: config.admin.foto_perfil }));
                }
            }
            if (config.mercado) {
                document.getElementById('nome-mercado').value = config.mercado.nome_mercado || 'Mercado BOM D+';
                document.getElementById('cnpj').value = config.mercado.cnpj || '';
                document.getElementById('estoque-minimo').value = config.mercado.estoque_minimo_padrao || 10;
            }
        } catch(e) {
            alert('Erro ao carregar configurações.');
        }
    }
    carregarConfiguracoes();
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
    formMeuPerfil.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const config = {
            nomeAdmin: document.getElementById('nome-completo').value,
            emailAdmin: document.getElementById('email').value, 
            profilePic: document.getElementById('profile-pic-preview').src
        };
        const configMercado = {
            nomeMercado: document.getElementById('nome-mercado').value,
            cnpj: document.getElementById('cnpj').value,
            estoqueMinimoPadrao: document.getElementById('estoque-minimo').value
        };
        
        try {
            const response = await fetch(`${API_URL}/configuracoes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, ...configMercado })
            });
            if (!response.ok) throw new Error('Falha ao salvar');
            
            alert('Perfil salvo com sucesso!');
            carregarDadosGlobaisUsuario(); 
        } catch(e) {
            alert('Erro ao salvar perfil.');
        }
    });
}
if (formConfigMercado) {
    formConfigMercado.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const config = {
            nomeMercado: document.getElementById('nome-mercado').value,
            cnpj: document.getElementById('cnpj').value,
            estoqueMinimoPadrao: document.getElementById('estoque-minimo').value
        };
        const configPerfil = {
            nomeAdmin: document.getElementById('nome-completo').value,
            emailAdmin: document.getElementById('email').value,
            profilePic: document.getElementById('profile-pic-preview').src
        };

        try {
            const response = await fetch(`${API_URL}/configuracoes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, ...configPerfil })
            });
            if (!response.ok) throw new Error('Falha ao salvar');
            
            alert('Configurações do Mercado salvas com sucesso!');
        } catch(e) {
            alert('Erro ao salvar configurações.');
        }
    });
}
const formAlterarSenha = document.getElementById('form-alterar-senha');
if (formAlterarSenha) {
    formAlterarSenha.addEventListener('submit', function(event) {
        event.preventDefault();
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
                // (Isso deve chamar uma rota de API, mas por enquanto limpa o localStorage)
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

async function aplicarFiltrosDeProduto() {
    if (!productTableBody) return; 

    let todosProdutos = cacheProdutos;
    if (todosProdutos.length === 0) {
        try {
            const response = await fetch(`${API_URL}/produtos`);
            todosProdutos = await response.json();
            cacheProdutos = todosProdutos;
        } catch(e) {
            console.error('Falha ao buscar produtos para filtro');
        }
    }
    
    const termoBusca = filtroBuscaInput ? filtroBuscaInput.value.toLowerCase() : '';
    const categoriaSelecionada = filtroCategoriaSelect ? filtroCategoriaSelect.value : '';

    const produtosFiltrados = todosProdutos.filter(produto => {
        const matchBusca = (produto.nome.toLowerCase().includes(termoBusca) || 
                           produto.sku.toLowerCase().includes(termoBusca));
        const matchCategoria = (categoriaSelecionada === "") || (produto.categoria_nome === categoriaSelecionada);
        return matchBusca && matchCategoria;
    });

    renderProductTable(produtosFiltrados);
}

if (filtroBuscaInput) {
    async function carregarFiltroCategorias() {
        try {
            const response = await fetch(`${API_URL}/categorias`);
            const categorias = await response.json();
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.nome; 
                option.textContent = categoria.nome; 
                filtroCategoriaSelect.appendChild(option);
            });
        } catch(e) { console.error("Erro ao carregar filtro de categorias"); }
    }
    carregarFiltroCategorias();

    filtroBuscaInput.addEventListener('keyup', aplicarFiltrosDeProduto);
    filtroCategoriaSelect.addEventListener('change', aplicarFiltrosDeProduto);
}


/* * =====================================
 * TAREFA 17: LÓGICA DA PESQUISA GLOBAL
 * =====================================
 */
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

        const sugestoes = paginasDoSite.filter(p => 
            p.nome.toLowerCase().includes(termoBusca)
        );

        globalSearchResults.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `<i class="${p.icone}" style="margin-right: 8px;"></i> ${p.nome}`;
                
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

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.search-bar')) {
            globalSearchResults.style.display = 'none';
        }
    });
}

/* * =====================================
 * TAREFA 18: LÓGICA DE PERFIS
 * =====================================
 */
const profileGrid = document.getElementById('profile-grid');
if (profileGrid) {
    // 1. Carrega os perfis da API
    async function carregarPerfis() {
        try {
            const response = await fetch(`${API_URL}/perfis`);
            const perfis = await response.json();
            
            profileGrid.innerHTML = ''; // Limpa a grade
            perfis.forEach(perfil => {
                const card = document.createElement('div');
                card.className = 'profile-card';
                card.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    <span>${perfil.nome}</span>
                `;
                // 2. Adiciona o clique para SELECIONAR o perfil
                card.addEventListener('click', () => {
                    localStorage.setItem('currentProfile', perfil.nome);
                    window.location.href = 'dashboard.html';
                });
                profileGrid.appendChild(card);
            });
        } catch (e) {
            profileGrid.innerHTML = '<p>Erro ao carregar perfis.</p>';
        }
    }
    carregarPerfis();
}

// Lógica de "Gerenciar Perfis" na página de Configurações
const formAddPerfil = document.getElementById('form-add-perfil');
const profileList = document.getElementById('profile-list');

async function carregarGerenciarPerfis() {
    if (!profileList) return; // Só roda se a lista existir
    try {
        const response = await fetch(`${API_URL}/perfis`);
        const perfis = await response.json();
        
        profileList.innerHTML = '';
        perfis.forEach(perfil => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${perfil.nome}</span>
                <button class="btn-action delete" data-id="${perfil.id}"><i class="fas fa-trash-alt"></i></button>
            `;
            profileList.appendChild(li);

            // Ativa o botão de deletar
            li.querySelector('.btn-action.delete').addEventListener('click', async () => {
                if (perfil.nome === 'Admin') { // Regra de segurança
                    alert('Não é possível excluir o perfil "Admin" principal.');
                    return;
                }
                if (confirm(`Tem certeza que quer excluir o perfil "${perfil.nome}"?`)) {
                    try {
                        await fetch(`${API_URL}/perfis/${perfil.id}`, { method: 'DELETE' });
                        alert('Perfil excluído!');
                        carregarGerenciarPerfis(); // Recarrega a lista
                    } catch (e) {
                        alert('Erro ao excluir perfil.');
                    }
                }
            });
        });
    } catch (e) {
        profileList.innerHTML = '<li><span>Erro ao carregar.</span></li>';
    }
}
// Carrega a lista de perfis na pág de config
if(profileList) carregarGerenciarPerfis();

// Lógica para ADICIONAR novo perfil
if (formAddPerfil) {
    formAddPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = document.getElementById('nome-perfil');
        const nome = input.value;
        
        if (!nome) return;

        try {
            await fetch(`${API_URL}/perfis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome })
            });
            input.value = ''; // Limpa o campo
            carregarGerenciarPerfis(); // Recarrega a lista
        } catch (e) {
            alert('Erro ao adicionar perfil.');
        }
    });
}