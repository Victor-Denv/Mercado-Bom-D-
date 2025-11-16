/* === app.js (VERSÃO FINAL SIMPLIFICADA SEM STORAGE/BASE64) === */

// --- IMPORTS DO FIREBASE (CDN) ---
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
    doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc,
    query, where, Timestamp, serverTimestamp, increment, writeBatch,
    orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
// ** FIREBASE STORAGE IMPORTS REMOVIDOS **

// --- IMPORTS LOCAIS ---
import { auth, db } from './firebase-config.js'; // Note: 'storage' foi removido daqui

// --- CONSTANTES GLOBAIS ---
const PLACEHOLDER_IMG = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNKfj6RsyRZqO4nnWkPFrYMmgrzDmyG31pFQ&s';
let cacheProdutos = [];
let cacheCategorias = [];
let deleteConfig = {}; 
// ** fotoBase64 e fotoAtualURL foram removidos **


/* * =====================================
 * FUNÇÕES AUXILIARES
 * ===================================== */
function getEmpresaId() {
    const empresaId = localStorage.getItem('empresaId');
    if (!empresaId) console.warn("ID da Empresa não encontrado no localStorage.");
    return empresaId;
}

async function logActivity(icon, color, title, description) {
    try {
        const empresaId = localStorage.getItem('empresaId');
        const perfil = localStorage.getItem('currentProfile') || 'Sistema';
        if (!empresaId) return;
        const newActivity = {
            icon, color, title, description,
            perfil_nome: perfil,
            timestamp: serverTimestamp(),
            time_string: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        const atividadesRef = collection(db, "empresas", empresaId, "atividades");
        await addDoc(atividadesRef, newActivity);
    } catch (e) { console.error('Falha ao registrar atividade:', e.message); }
}
// ** FUNÇÃO resizeAndEncodeImage REMOVIDA **


/* * =====================================
 * FUNÇÕES DE CARREGAMENTO DE PÁGINA
 * ===================================== */

async function carregarDadosGlobaisUsuario() {
    const headerProfileName = document.getElementById('header-profile-name');
    const headerProfilePic = document.getElementById('header-profile-pic');
    if (!headerProfileName || !headerProfilePic) return;

    const empresaId = localStorage.getItem('empresaId');
    const currentProfileName = localStorage.getItem('currentProfile');

    if (currentProfileName) {
        headerProfileName.textContent = currentProfileName;
    } else {
        headerProfileName.textContent = "Carregando...";
        return;
    }
    if (empresaId) {
        try {
            const perfilDocRef = doc(db, "empresas", empresaId, "perfis", currentProfileName);
            const docSnap = await getDoc(perfilDocRef);
            if (docSnap.exists()) {
                headerProfilePic.src = docSnap.data().foto_perfil || PLACEHOLDER_IMG;
            }
        } catch (e) { console.error(e); }
    }
}

async function carregarDropdownPerfis() {
    const profileDropdownList = document.getElementById('profile-dropdown-list');
    if (!profileDropdownList) return; 

    const empresaId = getEmpresaId();
    const currentProfileName = localStorage.getItem('currentProfile');
    if (!empresaId) return;

    const perfisRef = collection(db, "empresas", empresaId, "perfis");
    try {
        const querySnapshot = await getDocs(query(perfisRef, orderBy("nome", "asc")));
        profileDropdownList.innerHTML = ''; 

        if (querySnapshot.empty) {
            profileDropdownList.innerHTML = '<a href="configuracoes.html"><span>Adicionar Perfis</span></a>';
        }

        querySnapshot.forEach((docSnap) => {
            const perfil = docSnap.data();
            const link = document.createElement('a');
            link.href = "#"; 
            link.innerHTML = `
                <img src="${perfil.foto_perfil || PLACEHOLDER_IMG}" alt="${perfil.nome}" class="dropdown-avatar">
                <span>${perfil.nome}</span>
                ${perfil.nome === currentProfileName ? '<i class="fas fa-check current-profile-indicator"></i>' : ''}
            `;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (perfil.nome !== currentProfileName) {
                    localStorage.setItem('currentProfile', perfil.nome);
                    window.location.reload(); 
                }
            });
            profileDropdownList.appendChild(link);
        });

        const divider = document.createElement('div');
        divider.style.borderTop = "1px solid var(--border-light)";
        divider.style.margin = "5px 0";
        profileDropdownList.appendChild(divider);

        const manageLink = document.createElement('a');
        manageLink.href = "configuracoes.html";
        manageLink.innerHTML = `<i class="fas fa-cog" style="margin-right: 8px;"></i> Gerenciar Perfis`;
        profileDropdownList.appendChild(manageLink);

        const logoutLink = document.createElement('a');
        logoutLink.href = "#";
        logoutLink.innerHTML = `<i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i> Sair`;
        logoutLink.addEventListener('click', async (e) => {
             e.preventDefault();
             if (confirm('Você tem certeza que deseja sair?')) {
                try {
                    await signOut(auth);
                    localStorage.removeItem('empresaId');
                    localStorage.removeItem('currentProfile');
                    window.location.href = 'index.html';
                } catch (error) {
                    alert("Erro ao sair: " + error.message);
                }
            }
        });
        profileDropdownList.appendChild(logoutLink);

    } catch (e) { 
        console.error("Erro ao carregar dropdown de perfis:", e);
        profileDropdownList.innerHTML = '<a href="#"><span>Erro ao carregar</span></a>';
    }
}

async function carregarPerfis() {
    const profileGrid = document.getElementById('profile-grid');
    if (!profileGrid) return;
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    const perfisRef = collection(db, "empresas", empresaId, "perfis");
    try {
        const querySnapshot = await getDocs(query(perfisRef, orderBy("nome", "asc")));
        profileGrid.innerHTML = '';
        if (querySnapshot.empty) {
            profileGrid.innerHTML = `<p>Nenhum perfil encontrado. <a href="configuracoes.html">Adicionar perfis</a></p>`;
        }
        querySnapshot.forEach((doc) => {
            const perfil = doc.data();
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <img src="${perfil.foto_perfil || PLACEHOLDER_IMG}" alt="${perfil.nome}" class="profile-card-pic" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
                <span>${perfil.nome}</span>
            `;
            card.addEventListener('click', () => {
                localStorage.setItem('currentProfile', perfil.nome);
                window.location.href = 'dashboard.html';
            });
            profileGrid.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

function openModal(config) {
    const modalOverlay = document.getElementById('delete-modal');
    if (modalOverlay) {
        deleteConfig = config;
        modalOverlay.style.display = 'flex';
    }
}
function closeModal() {
    const modalOverlay = document.getElementById('delete-modal');
    if (modalOverlay) {
        deleteConfig = {};
        modalOverlay.style.display = 'none';
    }
}

async function carregarCategorias() {
    const categoryList = document.querySelector('.category-list');
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    const categoriasRef = collection(db, "empresas", empresaId, "categorias");
    try {
        const querySnapshot = await getDocs(query(categoriasRef, orderBy("nome", "asc")));
        cacheCategorias = [];
        if (categoryList) categoryList.innerHTML = ''; 

        if (querySnapshot.empty && categoryList) {
            categoryList.innerHTML = '<li><span>Nenhuma categoria cadastrada.</span></li>';
        }

        querySnapshot.forEach((docSnap) => {
            const categoria = docSnap.data();
            const categoriaId = docSnap.id;
            cacheCategorias.push({ id: categoriaId, nome: categoria.nome });

            if (categoryList) {
                const li = document.createElement('li');
                li.className = 'profile-item'; 
                li.innerHTML = `
                    <img src="${PLACEHOLDER_IMG}" alt="cat" class="dropdown-avatar" style="opacity: 0.2; width: 20px; height: 20px;">
                    <span>${categoria.nome}</span>
                    <button class="btn-action edit" style="visibility: hidden;"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-action delete"><i class="fas fa-trash-alt"></i></button>
                `;
                li.querySelector('.btn-action.delete').addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal({ type: 'categoria', id: categoriaId, nome: categoria.nome });
                });
                categoryList.appendChild(li);
            }
        });
        popularDropdownCategorias(cacheCategorias);
    } catch (e) { console.error(e); }
}

function popularDropdownCategorias(categorias) {
    const selects = document.querySelectorAll('#categoria-produto, #filtro-categoria');
    selects.forEach(select => {
        if (!select) return;
        const placeholderOption = select.querySelector('option');
        if (!placeholderOption) return; 
        const valorAntigo = select.value; 
        select.innerHTML = '';
        select.appendChild(placeholderOption);
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.nome;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
        select.value = valorAntigo; 
    });
}

async function carregarProdutos() {
    const productTableBody = document.getElementById('product-table-body');
    if (!productTableBody) return;
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    const produtosRef = collection(db, "empresas", empresaId, "produtos");
    try {
        const querySnapshot = await getDocs(query(produtosRef, orderBy("nome", "asc")));
        cacheProdutos = [];
        productTableBody.innerHTML = '';
        if (querySnapshot.empty) {
            productTableBody.innerHTML = '<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';
        }
        querySnapshot.forEach(docSnap => {
            const produto = docSnap.data();
            cacheProdutos.push(produto);
            const tr = document.createElement('tr');
            const emEstoqueBaixo = produto.qtd <= produto.estoque_minimo;
            tr.innerHTML = `
                <td>${produto.sku}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria_nome || ''}</td>
                <td><span class="${emEstoqueBaixo ? 'stock-low' : 'stock-ok'}">${produto.qtd}</span></td>
                <td>R$ ${(produto.venda || 0).toFixed(2)}</td>
                <td>
                    <button class="btn-action edit" data-sku="${produto.sku}">Editar</button>
                    <button class="btn-action delete" data-sku="${produto.sku}">Excluir</button>
                </td>
            `;
            productTableBody.appendChild(tr);
            tr.querySelector('.btn-action.delete').addEventListener('click', () => openModal({ type: 'produto', id: produto.sku, nome: produto.nome }));
            tr.querySelector('.btn-action.edit').addEventListener('click', () => window.location.href = `editar-produto.html?sku=${produto.sku}`);
        });
    } catch (e) { console.error(e); }
}

async function carregarProdutoParaEditar() {
    const formEditProduct = document.getElementById('form-edit-product');
    if (!formEditProduct) return;
    const urlParams = new URLSearchParams(window.location.search);
    const skuParaEditar = urlParams.get('sku');
    if (!skuParaEditar) {
        alert('Erro: SKU não fornecido.');
        window.location.href = 'produtos.html';
        return;
    }
    const empresaId = getEmpresaId();
    const produtoRef = doc(db, "empresas", empresaId, "produtos", skuParaEditar);
    try {
        const docSnap = await getDoc(produtoRef);
        if (docSnap.exists()) {
            const p = docSnap.data();
            document.getElementById('nome-produto').value = p.nome;
            document.getElementById('sku-produto').value = p.sku;
            document.getElementById('categoria-produto').value = p.categoria_nome;
            document.getElementById('preco-custo').value = p.custo;
            document.getElementById('preco-venda').value = p.venda;
            document.getElementById('qtd-inicial').value = p.qtd;
            document.getElementById('data-vencimento').value = p.vencimento ? p.vencimento.split('T')[0] : '';
            document.getElementById('estoque-minimo').value = p.estoque_minimo;
        } else {
            alert('Erro: Produto não encontrado.');
            window.location.href = 'produtos.html';
        }
    } catch (e) { alert('Erro ao carregar dados do produto.'); }
}

function aplicarFiltrosDeProduto() {
    const productTableBody = document.getElementById('product-table-body');
    if (!productTableBody) return;
    const filtroBuscaInput = document.getElementById('filtro-busca');
    const filtroCategoriaSelect = document.getElementById('filtro-categoria');
    const termoBusca = filtroBuscaInput ? filtroBuscaInput.value.toLowerCase() : '';
    const categoriaSelecionada = filtroCategoriaSelect ? filtroCategoriaSelect.value : '';
    const produtosFiltrados = cacheProdutos.filter(p =>
        (p.nome.toLowerCase().includes(termoBusca) || p.sku.toLowerCase().includes(termoBusca)) &&
        (categoriaSelecionada === "" || p.categoria_nome === categoriaSelecionada)
    );
    productTableBody.innerHTML = '';
    if (produtosFiltrados.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="6">Nenhum produto encontrado.</td></tr>';
        return;
    }
    produtosFiltrados.forEach(produto => {
        const tr = document.createElement('tr');
        const emEstoqueBaixo = produto.qtd <= produto.estoque_minimo;
        tr.innerHTML = `
            <td>${produto.sku}</td> <td>${produto.nome}</td> <td>${produto.categoria_nome || ''}</td>
            <td><span class="${emEstoqueBaixo ? 'stock-low' : 'stock-ok'}">${produto.qtd}</span></td>
            <td>R$ ${(produto.venda || 0).toFixed(2)}</td>
            <td>
                <button class="btn-action edit" data-sku="${produto.sku}">Editar</button>
                <button class="btn-action delete" data-sku="${produto.sku}">Excluir</button>
            </td>
        `;
        productTableBody.appendChild(tr);
        tr.querySelector('.btn-action.delete').addEventListener('click', () => openModal({ type: 'produto', id: produto.sku, nome: produto.nome }));
        tr.querySelector('.btn-action.edit').addEventListener('click', () => window.location.href = `editar-produto.html?sku=${produto.sku}`);
    });
}

async function carregarDashboard() {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return;
    const empresaId = getEmpresaId();
    if (!empresaId) return;
    const totalProdutosCard = statsGrid.querySelector('.stat-icon.green + .stat-info strong');
    const vendasDiaCard = statsGrid.querySelector('.stat-icon.yellow + .stat-info strong');
    const valorVendasMesCard = statsGrid.querySelector('.stat-icon.blue + .stat-info strong');
    const estoqueMinimoCard = statsGrid.querySelector('.stat-icon.red + .stat-info strong');
    try {
        const produtosRef = collection(db, "empresas", empresaId, "produtos");
        const produtosSnap = await getDocs(query(produtosRef, orderBy("nome", "asc")));
        let totalEstoqueBaixo = 0;
        produtosSnap.forEach(docSnap => {
            const p = docSnap.data();
            if (p.qtd <= p.estoque_minimo) totalEstoqueBaixo++;
        });
        if (totalProdutosCard) totalProdutosCard.textContent = produtosSnap.size;
        if (estoqueMinimoCard) estoqueMinimoCard.textContent = totalEstoqueBaixo;

        const fechamentosRef = collection(db, "empresas", empresaId, "fechamentos");
        const fechamentosSnap = await getDocs(query(fechamentosRef, orderBy("timestamp", "desc")));
        
        // CORREÇÃO DE FUSO HORÁRIO
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const hojeID = `${ano}-${mes}-${dia}`;
        // FIM DA CORREÇÃO

        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();
        let totalVendasDia = 0, totalVendasMes = 0;

        fechamentosSnap.forEach(docSnap => {
            const v = docSnap.data();
            const [fAno, fMes, fDia] = v.data_fechamento.split('-').map(Number);
            if (v.data_fechamento === hojeID) totalVendasDia = v.total;
            if (fAno === anoAtual && fMes === mesAtual) totalVendasMes += v.total;
        });
        if (vendasDiaCard) vendasDiaCard.textContent = `R$ ${totalVendasDia.toFixed(2)}`;
        if (valorVendasMesCard) valorVendasMesCard.textContent = `R$ ${totalVendasMes.toFixed(2)}`;
    } catch (e) { console.error(e); }

    const activityFeedList = document.getElementById('activity-feed-list');
    if (activityFeedList) {
        try {
            const atividadesRef = collection(db, "empresas", empresaId, "atividades");
            // CORREÇÃO PARA ORDENAR O EXTRATO
            const q = query(atividadesRef, orderBy("timestamp", "desc"), limit(10));
            const activitySnap = await getDocs(q);
            
            activityFeedList.innerHTML = '';
            if (activitySnap.empty) {
                activityFeedList.innerHTML = '<li class="feed-item"><span>Nenhuma atividade recente.</span></li>';
            }
            activitySnap.forEach(docSnap => {
                const act = docSnap.data();
                const li = document.createElement('li');
                li.className = 'feed-item';
                li.innerHTML = `
                    <div class="activity-icon ${act.color}"><i class="${act.icon}"></i></div>
                    <div class="activity-details"><strong>${act.perfil_nome}</strong> <span>${act.description}</span></div>
                    <span class="activity-time">${act.time_string}</span>`;
                activityFeedList.appendChild(li);
            });
        } catch (e) { console.error(e); }
    }
}

async function carregarRelatorioVendas() {
    const salesReportBody = document.getElementById('sales-report-body');
    if (!salesReportBody) return;
    const empresaId = getEmpresaId();
    const fechamentosRef = collection(db, "empresas", empresaId, "fechamentos");
    try {
        const querySnapshot = await getDocs(query(fechamentosRef, orderBy("timestamp", "desc")));
        salesReportBody.innerHTML = '';
        if (querySnapshot.empty) {
            salesReportBody.innerHTML = '<tr><td colspan="5">Nenhum fechamento registrado.</td></tr>';
        }
        querySnapshot.forEach(docSnap => {
            const v = docSnap.data();
            const [ano, mes, dia] = v.data_fechamento.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            salesReportBody.innerHTML += `
                <tr>
                    <td><strong>${dataFormatada}</strong></td>
                    <td class="total-col">R$ ${v.total.toFixed(2)}</td>
                    <td>R$ ${v.cartao.toFixed(2)}</td>
                    <td>R$ ${v.dinheiro.toFixed(2)}</td>
                    <td>R$ ${v.pix.toFixed(2)}</td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

async function carregarEstoqueBaixo() {
    const stockLowReportBody = document.getElementById('stock-low-report-body');
    if (!stockLowReportBody) return;
    const empresaId = getEmpresaId();
    const produtosRef = collection(db, "empresas", empresaId, "produtos");
    try {
        const querySnapshot = await getDocs(query(produtosRef, orderBy("nome", "asc")));
        stockLowReportBody.innerHTML = '';
        let count = 0;
        querySnapshot.forEach(docSnap => {
            const p = docSnap.data();
            if (p.qtd <= p.estoque_minimo) {
                count++;
                stockLowReportBody.innerHTML += `
                    <tr><td>${p.sku}</td> <td>${p.nome}</td> <td>${p.categoria_nome}</td>
                    <td><span class="stock-low">${p.qtd}</span></td> <td>${p.estoque_minimo}</td></tr>`;
            }
        });
        if (count === 0) {
            stockLowReportBody.innerHTML = '<tr><td colspan="5">Nenhum item com estoque baixo.</td></tr>';
        }
    } catch (e) { console.error(e); }
}

async function carregarInventario() {
    const inventoryReportBody = document.getElementById('inventory-report-body');
    if (!inventoryReportBody) return;
    const empresaId = getEmpresaId();
    const produtosRef = collection(db, "empresas", empresaId, "produtos");
    try {
        const querySnapshot = await getDocs(query(produtosRef, orderBy("nome", "asc")));
        inventoryReportBody.innerHTML = '';
        let grandTotal = 0;
        querySnapshot.forEach(docSnap => {
            const p = docSnap.data();
            const itemTotal = (p.custo || 0) * (p.qtd || 0);
            grandTotal += itemTotal;
            inventoryReportBody.innerHTML += `
                <tr><td>${p.nome}</td> <td>${p.qtd}</td>
                <td>R$ ${p.custo.toFixed(2)}</td> <td class="total-col">R$ ${itemTotal.toFixed(2)}</td></tr>`;
        });
        const totalFooter = document.getElementById('inventory-total-footer');
        if (totalFooter) totalFooter.textContent = `R$ ${grandTotal.toFixed(2)}`;
        if (querySnapshot.empty) {
            inventoryReportBody.innerHTML = '<tr><td colspan="4">Nenhum produto cadastrado.</td></tr>';
        }
    } catch (e) { console.error(e); }
}

async function carregarPerdas() {
    const lossesReportBody = document.getElementById('losses-report-body');
    if (!lossesReportBody) return;
    const empresaId = getEmpresaId();
    const perdasRef = collection(db, "empresas", empresaId, "perdas");
    try {
        const querySnapshot = await getDocs(query(perdasRef, orderBy("data_perda", "desc")));
        lossesReportBody.innerHTML = '';
        let totalPerdas = 0;
        querySnapshot.forEach(docSnap => {
            const p = docSnap.data();
            const custoPerda = p.custo_total || 0;
            totalPerdas += custoPerda;
            const dataFormatada = p.data_perda.toDate().toLocaleDateString('pt-BR');
            lossesReportBody.innerHTML += `
                <tr><td>${dataFormatada}</td> <td>${p.nome_produto}</td> <td>${p.qtd}</td>
                <td>${p.motivo}</td> <td class="stock-low">R$ ${custoPerda.toFixed(2)}</td></tr>`;
        });
        const totalLossesFooter = document.getElementById('losses-total-footer');
        if (totalLossesFooter) totalLossesFooter.textContent = `R$ ${totalPerdas.toFixed(2)}`;
        if (querySnapshot.empty) {
            lossesReportBody.innerHTML = '<tr><td colspan="5">Nenhum registro de perda.</td></tr>';
        }
    } catch (e) { console.error(e); }
}

async function carregarGerenciarPerfis() {
    const formConfigMercado = document.getElementById('form-config-mercado');
    const profileList = document.getElementById('profile-list');
    if (!formConfigMercado && !profileList) return;
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    if (formConfigMercado) {
        try {
            const empresaRef = doc(db, "empresas", empresaId);
            const docSnap = await getDoc(empresaRef);
            if (docSnap.exists()) {
                const config = docSnap.data();
                document.getElementById('nome-mercado').value = config.nomeMercado || '';
                document.getElementById('cnpj').value = config.cnpj || '';
                document.getElementById('estoque-minimo').value = config.estoqueMinimoPadrao || 10;
            }
        } catch (e) { console.error(e); }
    }
    if (profileList) {
        try {
            const perfisRef = collection(db, "empresas", empresaId, "perfis");
            const querySnapshot = await getDocs(query(perfisRef, orderBy("nome", "asc")));
            profileList.innerHTML = '';
            querySnapshot.forEach(docSnap => {
                const perfil = docSnap.data();
                const perfilId = docSnap.id;
                const li = document.createElement('li');
                li.className = 'profile-item';
                li.innerHTML = `
                    <img src="${perfil.foto_perfil || PLACEHOLDER_IMG}" alt="${perfil.nome}" class="dropdown-avatar">
                    <span>${perfil.nome}</span>
                    <button class="btn-action edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-action delete"><i class="fas fa-trash-alt"></i></button>
                `;
                profileList.appendChild(li);
                li.querySelector('.btn-action.edit').addEventListener('click', () => window.location.href = `editar-perfil.html?id=${perfilId}`);
                li.querySelector('.btn-action.delete').addEventListener('click', () => {
                    if (perfil.nome === 'Admin') return alert('Não é possível excluir o perfil "Admin".');
                    if (perfil.nome === localStorage.getItem('currentProfile')) return alert('Não é possível excluir o perfil em uso.');
                    openModal({ type: 'perfil', id: perfilId });
                });
            });
        } catch (e) { console.error(e); }
    }
}

async function carregarPerfilParaEditar() {
    const formEditPerfil = document.getElementById('form-edit-perfil');
    if (!formEditPerfil) return;
    const preview = document.getElementById('profile-pic-preview');
    const nomeInput = document.getElementById('nome-perfil');
    const urlParams = new URLSearchParams(window.location.search);
    const perfilId = urlParams.get('id');
    if (!perfilId) {
        alert('ID do perfil não fornecido.');
        window.location.href = 'configuracoes.html';
        return;
    }
    const empresaId = getEmpresaId();
    const perfilRef = doc(db, "empresas", empresaId, "perfis", perfilId);
    try {
        const docSnap = await getDoc(perfilRef);
        if (docSnap.exists()) {
            const perfil = docSnap.data();
            nomeInput.value = perfil.nome;
            preview.src = perfil.foto_perfil || PLACEHOLDER_IMG;
            fotoAtualURL = perfil.foto_perfil;
            if (perfil.nome === 'Admin') nomeInput.disabled = true;
        }
    } catch (e) { alert('Erro ao carregar dados do perfil.'); }
}

function setupGlobalSearch() {
    const globalSearchInput = document.getElementById('global-search-input');
    const globalSearchResults = document.getElementById('global-search-results');
    if (!globalSearchInput) return;
    const paginasDoSite = [
        { nome: 'Abrir Caixa (PDV)', href: 'pdv.html', icone: 'fas fa-cash-register' },
        { nome: 'Dashboard', href: 'dashboard.html', icone: 'fas fa-home' },
        { nome: 'Produtos', href: 'produtos.html', icone: 'fas fa-box' },
        { nome: 'Adicionar Produto', href: 'adicionar-produto.html', icone: 'fas fa-plus-circle' },
        { nome: 'Categorias', href: 'categorias.html', icone: 'fas fa-tags' },
        { nome: 'Registrar Entrada', href: 'registrar-entrada.html', icone: 'fas fa-arrow-down' },
        { nome: 'Registrar Perda/Ajuste', href: 'registrar-saida.html', icone: 'fas fa-arrow-up' },
        { nome: 'Relatórios de Vendas', href: 'relatorios-vendas.html', icone: 'fas fa-chart-bar' },
        { nome: 'Relatório: Estoque Baixo', href: 'relatorios-estoque-baixo.html', icone: 'fas fa-exclamation-triangle' },
        { nome: 'Relatório: Inventário', href: 'relatorios-inventario.html', icone: 'fas fa-dollar-sign' },
        { nome: 'Relatório: Perdas', href: 'relatorios-perdas.html', icone: 'fas fa-arrow-down' },
        { nome: 'Configurações', href: 'configuracoes.html', icone: 'fas fa-cog' }
    ];
    globalSearchInput.addEventListener('keyup', (e) => {
        const termo = e.target.value.toLowerCase();
        if (termo.length < 2) return globalSearchResults.style.display = 'none';
        const sugestoes = paginasDoSite.filter(p => p.nome.toLowerCase().includes(termo));
        globalSearchResults.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `<i class="${p.icone}" style="margin-right: 8px;"></i> ${p.nome}`;
                item.addEventListener('click', () => window.location.href = p.href);
                globalSearchResults.appendChild(item);
            });
            globalSearchResults.style.display = 'block';
        } else {
            globalSearchResults.style.display = 'none';
        }
    });
    document.addEventListener('click', (e) => {
        if (globalSearchResults && !e.target.closest('.search-bar')) {
            globalSearchResults.style.display = 'none';
        }
    });
}


/* * =====================================
 * PONTO DE ENTRADA ÚNICO (O "Guarda")
 * ===================================== */

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const paginasDeLogin = ['index.html', 'cadastro.html'];

onAuthStateChanged(auth, (user) => {
    
    const currentProfile = localStorage.getItem('currentProfile');

    if (user) {
        // --- USUÁRIO ESTÁ LOGADO ---
        localStorage.setItem('empresaId', user.uid);

        if (!currentProfile && currentPage !== 'perfis.html' && currentPage !== 'configuracoes.html' && currentPage !== 'editar-perfil.html') {
            window.location.href = 'perfis.html';
            return;
        }
        if (paginasDeLogin.includes(currentPage)) {
            window.location.href = currentProfile ? 'dashboard.html' : 'perfis.html';
            return;
        }

        // --- USUÁRIO LOGADO E AUTORIZADO ---
        // Roda todas as funções de carregamento
        carregarDadosGlobaisUsuario();
        carregarDropdownPerfis();
        setupGlobalSearch();
        carregarCategorias(); // (Precisa rodar em todo lado para os dropdowns)
        carregarPerfis();
        carregarDashboard();
        carregarProdutos();
        carregarGerenciarPerfis();
        carregarProdutoParaEditar();
        carregarPerfilParaEditar();
        carregarRelatorioVendas();
        carregarEstoqueBaixo();
        carregarInventario();
        carregarPerdas();

    } else {
        // --- USUÁRIO NÃO ESTÁ LOGADO ---
        if (!paginasDeLogin.includes(currentPage)) {
            localStorage.removeItem('empresaId');
            localStorage.removeItem('currentProfile');
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'index.html';
        }
    }
});


/* * =====================================
 * LISTENERS DE FORMULÁRIO (Definidos uma só vez)
 * ===================================== */

// --- FORMULÁRIOS DE LOGIN/CADASTRO ---
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmaSenha = document.getElementById('confirma-senha').value;
        if (senha !== confirmaSenha) return alert("As senhas não conferem!");
        if (senha.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;
            const batch = writeBatch(db);
            const empresaDocRef = doc(db, "empresas", user.uid);
            batch.set(empresaDocRef, {
                adminEmail: user.email,
                createdAt: serverTimestamp(),
                nomeMercado: "Meu Mercado",
                estoqueMinimoPadrao: 10
            });
            const perfilAdminRef = doc(db, "empresas", user.uid, "perfis", "Admin");
            batch.set(perfilAdminRef, { nome: "Admin", foto_perfil: PLACEHOLDER_IMG });
            await batch.commit();
            alert(`Conta criada com sucesso para ${user.email}!`);
            window.location.href = 'index.html';
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') alert("Erro: Este email já está em uso.");
            else alert("Erro ao criar conta: " + error.message);
        }
    });
}

const loginForm = document.getElementById('form-login');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            localStorage.setItem('empresaId', userCredential.user.uid);
            localStorage.removeItem('currentProfile');
            window.location.href = 'perfis.html';
        } catch (error) {
            alert("Erro: Email ou senha incorretos.");
        }
    });
}

// --- DROPDOWN DE PERFIL (HEADER) ---
const profileDropdown = document.getElementById('profile-dropdown');
if (profileDropdown) {
    const dropdownContent = document.getElementById('profile-dropdown-list');
    profileDropdown.addEventListener('click', (event) => {
        if (event.target.tagName === 'A' || event.target.closest('a')) return;
        const isShown = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isShown ? 'none' : 'block';
        profileDropdown.classList.toggle('active', !isShown);
    });
    document.addEventListener('click', (event) => {
        if (profileDropdown && dropdownContent && !profileDropdown.contains(event.target)) {
            dropdownContent.style.display = 'none';
            profileDropdown.classList.remove('active');
        }
    });
}

// --- BOTÃO SAIR (SIDEBAR) ---
const logoutButton = document.querySelector('.sidebar-footer a');
if (logoutButton) {
    logoutButton.addEventListener('click', async (event) => { // A variável é 'event'
        
        event.preventDefault(); // Garantir que usa 'event'
        
        if (confirm('Você tem certeza que deseja sair?')) {
            try {
                await signOut(auth);
                localStorage.removeItem('empresaId'); 
                localStorage.removeItem('currentProfile'); 
                window.location.href = 'index.html'; // Manda para o index
            } catch (error) {
                alert("Erro ao sair: " + error.message);
            }
        }
    });
}
// --- MODAL DE CONFIRMAÇÃO (Listeners) ---
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalBtnConfirm = document.getElementById('modal-btn-confirm');
const modalCloseIcon = document.querySelector('.modal-close-icon');
if (modalBtnCancel) modalBtnCancel.addEventListener('click', closeModal);
if (modalCloseIcon) modalCloseIcon.addEventListener('click', closeModal);
if (modalBtnConfirm) {
    modalBtnConfirm.addEventListener('click', async () => {
        const empresaId = getEmpresaId();
        if (!empresaId || !deleteConfig.type || !deleteConfig.id) return closeModal();
        let docRef;
        let logMessage = "";
        try {
            if (deleteConfig.type === 'categoria') {
                docRef = doc(db, "empresas", empresaId, "categorias", deleteConfig.id);
                logMessage = `Categoria "${deleteConfig.nome || ''}" foi removida.`;
            } else if (deleteConfig.type === 'produto') {
                docRef = doc(db, "empresas", empresaId, "produtos", deleteConfig.id);
                logMessage = `Produto "${deleteConfig.nome || ''}" (SKU: ${deleteConfig.id}) foi removido.`;
            } else if (deleteConfig.type === 'perfil') {
                // CORREÇÃO: Adiciona a lógica para apagar a foto do Storage
                try {
                    const perfilRef = doc(db, "empresas", empresaId, "perfis", deleteConfig.id);
                    const perfilSnap = await getDoc(perfilRef);
                    if (perfilSnap.exists()) {
                        const fotoURL = perfilSnap.data().foto_perfil;
                        if (fotoURL && fotoURL.includes('firebasestorage')) {
                            await deleteObject(ref(storage, fotoURL));
                        }
                    }
                } catch (e) {
                    console.warn("Não foi possível apagar a foto do perfil do Storage:", e);
                }
                // FIM DA CORREÇÃO
                docRef = doc(db, "empresas", empresaId, "perfis", deleteConfig.id);
                logMessage = `Perfil "${deleteConfig.id}" foi removido.`;
            } else {
                return closeModal(); 
            }
            await deleteDoc(docRef);
            await logActivity('fas fa-trash-alt', 'red', 'Item Excluído', logMessage);
            closeModal();
            if (deleteConfig.type === 'categoria') carregarCategorias();
            if (deleteConfig.type === 'produto') carregarProdutos();
            if (deleteConfig.type === 'perfil') carregarGerenciarPerfis();
        } catch (e) { alert(`Erro ao excluir: ${e.message}`); }
    });
}

// --- FORM ADICIONAR CATEGORIA ---
const formAddCategory = document.getElementById('form-add-categoria');
if (formAddCategory) {
    formAddCategory.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryNameInput = document.getElementById('nome-categoria');
        const categoryName = categoryNameInput.value.trim();
        const empresaId = getEmpresaId();
        if (!categoryName || !empresaId) return;
        try {
            const categoriasRef = collection(db, "empresas", empresaId, "categorias");
            await addDoc(categoriasRef, { nome: categoryName });
            await logActivity('fas fa-tags', 'gray', 'Nova Categoria', `A categoria "${categoryName}" foi criada.`);
            categoryNameInput.value = '';
            carregarCategorias();
        } catch (e) { alert(`Erro: ${e.message}`); }
    });
}

// --- FORM ADICIONAR PRODUTO ---
const formAddProduct = document.getElementById('form-add-product');
if (formAddProduct) {
    formAddProduct.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const sku = document.getElementById('sku-produto').value;
        if (!sku) return alert("O Código (SKU) é obrigatório!");
        const novoProduto = {
            nome: document.getElementById('nome-produto').value, sku: sku,
            categoria_nome: document.getElementById('categoria-produto').value,
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value || null,
            estoque_minimo: parseInt(document.getElementById('estoque-minimo').value) || 10,
            createdAt: serverTimestamp()
        };
        try {
            const produtoRef = doc(db, "empresas", empresaId, "produtos", sku);
            const docSnap = await getDoc(produtoRef);
            if (docSnap.exists()) throw new Error(`O SKU "${sku}" já está cadastrado.`);
            await setDoc(produtoRef, novoProduto);
            await logActivity('fas fa-box', 'blue', 'Novo Produto', `"${novoProduto.nome}" (SKU: ${sku}) foi cadastrado.`);
            alert('Produto cadastrado com sucesso!');
            window.location.href = 'produtos.html';
        } catch (e) { alert(`Erro: ${e.message}`); }
    });
}

// --- FORM EDITAR PRODUTO ---
const formEditProduct = document.getElementById('form-edit-product');
if (formEditProduct) {
    formEditProduct.addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const skuParaEditar = urlParams.get('sku');
        const empresaId = getEmpresaId();
        const produtoRef = doc(db, "empresas", empresaId, "produtos", skuParaEditar);
        const produtoAtualizado = {
            nome: document.getElementById('nome-produto').value,
            categoria_nome: document.getElementById('categoria-produto').value,
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value || null,
            estoque_minimo: parseInt(document.getElementById('estoque-minimo').value) || 10
        };
        try {
            await updateDoc(produtoRef, produtoAtualizado);
            await logActivity('fas fa-pencil-alt', 'blue', 'Produto Editado', `"${produtoAtualizado.nome}" (SKU: ${skuParaEditar}) foi atualizado.`);
            alert('Produto atualizado com sucesso!');
            window.location.href = 'produtos.html';
        } catch (e) { alert(`Erro ao salvar: ${e.message}`); }
    });
}

// --- FILTROS DE PRODUTO ---
const filtroBuscaInput = document.getElementById('filtro-busca');
const filtroCategoriaSelect = document.getElementById('filtro-categoria');
if (filtroBuscaInput) filtroBuscaInput.addEventListener('keyup', aplicarFiltrosDeProduto);
if (filtroCategoriaSelect) filtroCategoriaSelect.addEventListener('change', aplicarFiltrosDeProduto);

// --- FORM REGISTRAR ENTRADA ---
const formEntrada = document.getElementById('form-add-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const sku = document.getElementById('produto-sku-selecionado').value;
        const qtd = parseInt(document.getElementById('quantidade').value) || 0;
        if (!sku || qtd <= 0) return alert('Selecione um produto e quantidade válida.');
        try {
            const produtoRef = doc(db, "empresas", empresaId, "produtos", sku);
            await updateDoc(produtoRef, { qtd: increment(qtd) });
            await logActivity('fas fa-arrow-down', 'green', 'Entrada de Estoque', `+${qtd} un. de "${document.getElementById('buscar-produto').value}" (SKU: ${sku})`);
            alert(`Entrada registrada!`);
            window.location.href = 'produtos.html';
        } catch (e) { alert(`Erro: ${e.message}`); }
    });
}

// --- FORM REGISTRAR SAÍDA ---
const formSaida = document.getElementById('form-add-saida');
if (formSaida) {
    formSaida.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const sku = document.getElementById('produto-sku-selecionado').value;
        const qtd = parseInt(document.getElementById('quantidade-saida').value) || 0;
        const motivo = document.getElementById('motivo-saida').value;
        if (!sku || qtd <= 0 || !motivo) return alert('Selecione produto, quantidade e motivo.');
        const produto = cacheProdutos.find(p => p.sku === sku);
        if (!produto) return alert('Erro: Produto não encontrado.');
        if (qtd > produto.qtd) return alert(`Erro: Estoque atual (${produto.qtd}) insuficiente.`);
        const custoTotalPerda = (produto.custo || 0) * qtd;
        try {
            const batch = writeBatch(db);
            const produtoRef = doc(db, "empresas", empresaId, "produtos", sku);
            batch.update(produtoRef, { qtd: increment(-qtd) });
            const perdasRef = collection(db, "empresas", empresaId, "perdas");
            batch.set(doc(perdasRef), {
                sku: sku, nome_produto: produto.nome, qtd: qtd, motivo: motivo,
                observacao: document.getElementById('observacao').value,
                custo_total: custoTotalPerda, data_perda: serverTimestamp()
            });
            await batch.commit();
            await logActivity('fas fa-arrow-up', 'red', `Saída (${motivo})`, `-${qtd} un. de "${produto.nome}"`);
            alert(`Saída registrada!`);
            window.location.href = 'produtos.html';
        } catch (e) { alert(`Erro: ${e.message}`); }
    });
}

// --- FORM FECHAMENTO DE CAIXA ---
const formFechamento = document.getElementById('form-fechamento');
if (formFechamento) {
    const dataField = document.getElementById('data-fechamento');
    if(dataField && !dataField.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        dataField.value = `${ano}-${mes}-${dia}`;
    }
    formFechamento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const dataID = document.getElementById('data-fechamento').value;
        if (!dataID) return alert("Data inválida!");
        const fechamento = {
            dinheiro: parseFloat(document.getElementById('total-dinheiro').value) || 0,
            cartao: parseFloat(document.getElementById('total-cartao').value) || 0,
            pix: parseFloat(document.getElementById('total-pix').value) || 0,
            data_fechamento: dataID,
            timestamp: Timestamp.fromDate(new Date(dataID + "T12:00:00"))
        };
        fechamento.total = fechamento.dinheiro + fechamento.cartao + fechamento.pix;
        try {
            const fechamentoRef = doc(db, "empresas", empresaId, "fechamentos", dataID);
            const docSnap = await getDoc(fechamentoRef);
            if(docSnap.exists() && !confirm("O caixa para esta data já foi fechado. Deseja sobrescrever?")) return;
            await setDoc(fechamentoRef, fechamento);
            await logActivity('fas fa-wallet', 'yellow', 'Fechamento de Caixa', `Caixa de ${dataID} fechado com R$ ${fechamento.total.toFixed(2)}.`);
            alert('Fechamento salvo! Total: R$ ' + fechamento.total.toFixed(2));
            window.location.href = 'dashboard.html';
        } catch (e) { alert(`Erro: ${e.message}`); }
    });
}

// --- FORM CONFIGURAÇÕES DO MERCADO ---
const formConfigMercado = document.getElementById('form-config-mercado');
if (formConfigMercado) {
    formConfigMercado.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const empresaRef = doc(db, "empresas", empresaId);
        const config = {
            nomeMercado: document.getElementById('nome-mercado').value,
            cnpj: document.getElementById('cnpj').value,
            estoqueMinimoPadrao: parseInt(document.getElementById('estoque-minimo').value) || 10
        };
        try {
            await updateDoc(empresaRef, config);
            alert('Configurações salvas!');
        } catch (e) { alert('Erro ao salvar: ' + e.message); }
    });
}

// --- FORM ADICIONAR PERFIL ---
const formAddPerfil = document.getElementById('form-add-perfil');
if (formAddPerfil) {
    formAddPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const input = document.getElementById('nome-perfil');
        const nome = input.value.trim();
        if (!nome) return;
        try {
            const perfilRef = doc(db, "empresas", empresaId, "perfis", nome);
            const docSnap = await getDoc(perfilRef);
            if(docSnap.exists()) return alert("Erro: Já existe um perfil com este nome.");
            await setDoc(perfilRef, { nome: nome, foto_perfil: PLACEHOLDER_IMG });
            await logActivity('fas fa-user-plus', 'blue', 'Novo Perfil', `O perfil "${nome}" foi criado.`);
            input.value = '';
            carregarGerenciarPerfis();
        } catch (e) { alert('Erro: ' + e.message); }
    });
}

// --- FORM EDITAR PERFIL ---
// --- FORM EDITAR PERFIL (VERSÃO SEM UPLOAD DE FOTO) ---
const formEditPerfil = document.getElementById('form-edit-perfil');
if (formEditPerfil) {
    // Remove os listeners de foto, pois não vamos usar
    // const fotoInput = document.getElementById('profile-pic-input');
    // const removeBtn = document.getElementById('profile-pic-remove');
    // const preview = document.getElementById('profile-pic-preview');
    // fotoInput.addEventListener('change', ...);
    // removeBtn.addEventListener('click', ...);

    // Listener de SUBMIT (Salvar)
    formEditPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const urlParams = new URLSearchParams(window.location.search);
        const perfilId = urlParams.get('id');
        const nomeNovo = document.getElementById('nome-perfil').value.trim();
        
        // No Firebase, o ID do documento de perfil É o nome.
        // Se o usuário tentar mudar o nome, vai quebrar a lógica.
        if (nomeNovo !== perfilId) {
           alert("Erro: Mudar o nome do perfil não é permitido. Você pode excluir este e criar um novo.");
           document.getElementById('nome-perfil').value = perfilId; // Restaura o nome original
           return; 
        }
        
        try {
            // Como não há foto, apenas verificamos o nome e salvamos.
            // O 'updateDoc' aqui é só para garantir, mas o nome não deve mudar.
            const perfilRef = doc(db, "empresas", empresaId, "perfis", perfilId);
            await updateDoc(perfilRef, { 
                nome: nomeNovo 
                // A linha 'foto_perfil' foi removida
            });

            await logActivity('fas fa-user-edit', 'blue', 'Perfil Editado', `O perfil "${nomeNovo}" foi atualizado (sem foto).`);
            alert('Perfil salvo!');
            window.location.href = 'configuracoes.html';

        } catch (e) { 
            alert('Erro ao salvar: ' + e.message); 
        }
    });
}
// --- AUTOCOMPLETE (Listeners) ---
const searchInput = document.getElementById('buscar-produto');
if (searchInput) {
    const suggestionsBox = document.getElementById('suggestions-box');
    searchInput.addEventListener('focus', async () => {
        if (cacheProdutos.length === 0) {
            const empresaId = getEmpresaId();
            if (!empresaId) return;
            const produtosRef = collection(db, "empresas", empresaId, "produtos");
            const querySnapshot = await getDocs(query(produtosRef, orderBy("nome", "asc")));
            querySnapshot.forEach(docSnap => cacheProdutos.push(docSnap.data()));
        }
    });
    searchInput.addEventListener('keyup', (e) => {
        const termoBusca = e.target.value.toLowerCase();
        if (termoBusca.length < 1) return suggestionsBox.style.display = 'none';
        const sugestoes = cacheProdutos.filter(p => p.nome.toLowerCase().includes(termoBusca) || p.sku.startsWith(termoBusca));
        suggestionsBox.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `<strong>${p.nome}</strong> <small>SKU: ${p.sku} (Qtd: ${p.qtd})</small>`;
                item.addEventListener('click', () => {
                    document.getElementById('produto-sku-selecionado').value = p.sku;
                    document.getElementById('produto-qtd-atual').value = p.qtd;
                    let dataFormatada = 'Sem vencimento';
                    if (p.vencimento) {
                        const partes = p.vencimento.split('T')[0].split('-');
                        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                    }
                    document.getElementById('produto-vencimento').value = dataFormatada;
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
 * =====================================
 * LÓGICA DO PDV (PONTO DE VENDA)
 * =====================================
 * ===================================== */

// --- Elementos da página PDV ---
// Movemos as definições para dentro do "if" para garantir que a página existe
const pagePDV = document.getElementById('pdv-page');

if (pagePDV) { // SÓ EXECUTA O CÓDIGO SE ESTIVER NA PÁGINA PDV
    
    // --- Variável global para o carrinho ---
    let carrinhoPDV = [];
    let totalVendaPDV = 0;

    // --- Elementos ---
    const searchInputPDV = document.getElementById('buscar-produto-pdv');
    const suggestionsBoxPDV = document.getElementById('suggestions-box-pdv');
    const cartBodyPDV = document.getElementById('pdv-cart-body');
    const totalValorPDV = document.getElementById('pdv-total-valor');

    const tipoPagamentoPDV = document.getElementById('pdv-tipo-pagamento');
    const trocoContainerPDV = document.getElementById('pdv-troco-container');
    const valorPagoPDV = document.getElementById('pdv-valor-pago');
    const trocoHintPDV = document.getElementById('pdv-troco-hint');

    const btnFinalizarVenda = document.getElementById('btn-finalizar-venda');
    const btnCancelarVenda = document.getElementById('btn-cancelar-venda');

    // --- Funções do PDV ---

    /** Limpa o carrinho e reseta a tela */
    function limparVendaPDV() {
        carrinhoPDV = [];
        totalVendaPDV = 0;
        cartBodyPDV.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280;">Carrinho vazio</td></tr>';
        totalValorPDV.textContent = 'R$ 0,00';
        valorPagoPDV.value = '';
        trocoHintPDV.textContent = 'Troco: R$ 0,00';
        trocoHintPDV.style.color = 'var(--text-gray)';
        searchInputPDV.value = '';
        searchInputPDV.focus();
    }

    /** Calcula o troco baseado no valor pago */
    function calcularTrocoPDV() {
        const valorPago = parseFloat(valorPagoPDV.value) || 0;
        if (valorPago === 0 && totalVendaPDV === 0) {
            trocoHintPDV.textContent = 'Troco: R$ 0,00';
            trocoHintPDV.style.color = 'var(--text-gray)';
            return;
        }
        
        const troco = valorPago - totalVendaPDV;

        if (valorPago > 0) {
            if (troco >= 0) {
                trocoHintPDV.textContent = `Troco: R$ ${troco.toFixed(2)}`;
                trocoHintPDV.style.color = 'var(--primary-green)';
            } else {
                trocoHintPDV.textContent = `Faltam: R$ ${Math.abs(troco).toFixed(2)}`;
                trocoHintPDV.style.color = 'var(--stock-low)'; // Vermelho
            }
        } else {
             trocoHintPDV.textContent = 'Troco: R$ 0,00';
             trocoHintPDV.style.color = 'var(--text-gray)';
        }
    }

    /** Desenha a tabela do carrinho com os itens e calcula o total */
    function atualizarCarrinhoPDV() {
        if (carrinhoPDV.length === 0) {
            cartBodyPDV.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280;">Carrinho vazio</td></tr>';
            totalVendaPDV = 0; // Garante que o total é zero
        } else {
            cartBodyPDV.innerHTML = '';
            totalVendaPDV = 0;
            carrinhoPDV.forEach((item, index) => {
                const itemTotal = item.venda * item.qtd_venda;
                totalVendaPDV += itemTotal;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.nome}</strong><br><small>SKU: ${item.sku}</small></td>
                    <td>
                        <input type="number" value="${item.qtd_venda}" min="1" max="${item.qtd_estoque}" data-index="${index}" class="pdv-item-qtd" style="width: 60px; padding: 5px;">
                    </td>
                    <td>R$ ${item.venda.toFixed(2)}</td>
                    <td><strong>R$ ${itemTotal.toFixed(2)}</strong></td>
                    <td>
                        <button class="btn-action delete" data-index="${index}">
                            <i class="fas fa-trash-alt" style="margin-right: 0;"></i>
                        </button>
                    </td>
                `;
                cartBodyPDV.appendChild(tr);
            });
        }
        totalValorPDV.textContent = `R$ ${totalVendaPDV.toFixed(2)}`;
        if(tipoPagamentoPDV.value === 'dinheiro') {
            calcularTrocoPDV();
        }
    }

    /** Adiciona um produto ao carrinho ou incrementa a quantidade */
    function adicionarAoCarrinhoPDV(produto) {
        // 1. Verifica se o produto tem estoque
        if (produto.qtd <= 0) {
            alert(`Produto "${produto.nome}" está sem estoque!`);
            return;
        }

        const itemExistente = carrinhoPDV.find(item => item.sku === produto.sku);
        
        if (itemExistente) {
            if (itemExistente.qtd_venda < produto.qtd) { 
                itemExistente.qtd_venda++;
            } else {
                alert(`Você não pode vender mais do que as ${produto.qtd} unidades em estoque.`);
            }
        } else {
            carrinhoPDV.push({
                sku: produto.sku,
                nome: produto.nome,
                venda: produto.venda,
                custo: produto.custo,
                qtd_estoque: produto.qtd,
                qtd_venda: 1
            });
        }
        
        atualizarCarrinhoPDV();
        searchInputPDV.value = '';
        suggestionsBoxPDV.style.display = 'none';
        searchInputPDV.focus();
    }
    
    /** Garante que o cache de produtos está carregado */
    async function carregarCacheParaPDV() {
        if (cacheProdutos.length === 0) {
            console.log("PDV: Cache de produtos vazio. Carregando...");
            const empresaId = getEmpresaId();
            if (!empresaId) return;
            const produtosRef = collection(db, "empresas", empresaId, "produtos");
            const querySnapshot = await getDocs(query(produtosRef, orderBy("nome", "asc")));
            querySnapshot.forEach(docSnap => cacheProdutos.push(docSnap.data()));
            console.log("PDV: Cache carregado com", cacheProdutos.length, "produtos.");
        } else {
             console.log("PDV: Cache já continha", cacheProdutos.length, "produtos.");
        }
    }

    // --- Listeners do PDV ---
    
    // Listener 1: Busca de Produto (CORRIGIDO)
    searchInputPDV.addEventListener('keyup', async (e) => {
        // Garante que o cache está carregado ANTES de tentar buscar
        await carregarCacheParaPDV();
        
        const termoBusca = e.target.value.toLowerCase();
        if (termoBusca.length < 1) {
            suggestionsBoxPDV.style.display = 'none';
            return;
        }
        
        const sugestoes = cacheProdutos.filter(p => 
            (p.nome.toLowerCase().includes(termoBusca) || p.sku.toLowerCase().startsWith(termoBusca)) &&
            p.qtd > 0 
        );
        
        suggestionsBoxPDV.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `<strong>${p.nome}</strong> <small>SKU: ${p.sku} (R$ ${p.venda.toFixed(2)}) (Estoque: ${p.qtd})</small>`;
                item.addEventListener('click', () => {
                    adicionarAoCarrinhoPDV(p);
                });
                suggestionsBoxPDV.appendChild(item);
            });
            suggestionsBoxPDV.style.display = 'block';
        } else {
            suggestionsBoxPDV.style.display = 'none';
        }
    });
    
    // Listener 2: Mudança no carrinho (excluir ou mudar qtd)
    cartBodyPDV.addEventListener('click', (e) => {
        if (e.target.closest('.delete')) {
            const index = e.target.closest('.delete').dataset.index;
            carrinhoPDV.splice(index, 1);
            atualizarCarrinhoPDV();
        }
    });
    
    cartBodyPDV.addEventListener('change', (e) => {
        if (e.target.classList.contains('pdv-item-qtd')) {
            const index = e.target.dataset.index;
            let novaQtd = parseInt(e.target.value) || 1;
            const item = carrinhoPDV[index];
            
            if (novaQtd > item.qtd_estoque) {
                alert(`Estoque máximo para este item é ${item.qtd_estoque}`);
                novaQtd = item.qtd_estoque;
                e.target.value = novaQtd;
            }
            if (novaQtd <= 0) {
                novaQtd = 1;
                e.target.value = 1;
            }
            item.qtd_venda = novaQtd;
            atualizarCarrinhoPDV();
        }
    });

    // Listener 3: Lógica de Pagamento e Troco
    tipoPagamentoPDV.addEventListener('change', () => {
        if (tipoPagamentoPDV.value === 'dinheiro') {
            trocoContainerPDV.style.display = 'block';
            valorPagoPDV.focus();
        } else {
            trocoContainerPDV.style.display = 'none';
            valorPagoPDV.value = '';
            trocoHintPDV.textContent = 'Troco: R$ 0,00';
            trocoHintPDV.style.color = 'var(--text-gray)';
        }
    });
    
    valorPagoPDV.addEventListener('keyup', calcularTrocoPDV);

    // Listener 4: Cancelar Venda (CORRIGIDO)
    btnCancelarVenda.addEventListener('click', () => {
        if (carrinhoPDV.length > 0) {
            if (confirm('Você tem certeza que deseja limpar o carrinho e cancelar esta venda?')) {
                limparVendaPDV();
            }
        } else {
            limparVendaPDV(); // Se já está vazio, apenas reseta os campos
        }
    });
    
   // Listener 5: Finalizar Venda (VERSÃO 2.1 - CORRIGE RELATÓRIOS)
    btnFinalizarVenda.addEventListener('click', async () => {
        const empresaId = getEmpresaId();
        if (carrinhoPDV.length === 0) {
            return alert('O carrinho está vazio.');
        }
        
        const tipoPagamento = tipoPagamentoPDV.value; // 'dinheiro', 'cartao', 'pix'
        
        if (tipoPagamento === 'dinheiro') {
            const valorPago = parseFloat(valorPagoPDV.value) || 0;
            if (valorPago < totalVendaPDV) {
                return alert('O valor pago é menor que o total da venda.');
            }
        }
        
        if (!confirm(`Finalizar venda de R$ ${totalVendaPDV.toFixed(2)}?`)) {
            return;
        }
        
        btnFinalizarVenda.disabled = true;
        btnFinalizarVenda.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        
        try {
            const batch = writeBatch(db);
            
            // 1. Atualizar o estoque de cada produto
            for (const item of carrinhoPDV) {
                const produtoRef = doc(db, "empresas", empresaId, "produtos", item.sku);
                batch.update(produtoRef, { 
                    qtd: increment(-item.qtd_venda) 
                });
            }

            // 2. ATUALIZAR O TOTAL DE VENDAS DO DIA
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const dataID = `${ano}-${mes}-${dia}`;

            const fechamentoRef = doc(db, "empresas", empresaId, "fechamentos", dataID);

            // --- ESTA É A ALTERAÇÃO ---
            // Agora, garantimos que os 3 campos de pagamento são incrementados,
            // mesmo que seja com 0, para que eles existam no documento.
            const incrementoVenda = {
                total: increment(totalVendaPDV),
                dinheiro: increment(tipoPagamento === 'dinheiro' ? totalVendaPDV : 0),
                cartao: increment(tipoPagamento === 'cartao' ? totalVendaPDV : 0),
                pix: increment(tipoPagamento === 'pix' ? totalVendaPDV : 0),
                data_fechamento: dataID,
                timestamp: Timestamp.fromDate(new Date(dataID + "T12:00:00"))
            };
            // --- FIM DA ALTERAÇÃO ---

            // Usa 'set' com 'merge' para criar ou atualizar
            batch.set(fechamentoRef, incrementoVenda, { merge: true });
            
            // 3. Commitar as alterações no banco
            await batch.commit();
            
            // 4. Registrar atividade
            const tipoPagamentoTexto = tipoPagamentoPDV.options[tipoPagamentoPDV.selectedIndex].text;
            await logActivity(
                'fas fa-shopping-cart', 
                'green', 
                'Venda Realizada', 
                `Venda de R$ ${totalVendaPDV.toFixed(2)} (${carrinhoPDV.length} itens). Pagamento: ${tipoPagamentoTexto}.`
            );
            
            // 5. Sucesso
            alert('Venda finalizada! Estoque e Totais do Dia atualizados.');
            limparVendaPDV();
            cacheProdutos = []; 
            
        } catch (error) {
            console.error("Erro ao finalizar venda: ", error);
            alert("Erro ao finalizar a venda: " + error.message);
        } finally {
            btnFinalizarVenda.disabled = false;
            btnFinalizarVenda.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Venda';
        }
    });
    
    // Limpa o carrinho ao carregar a página
    limparVendaPDV();
}
// --- FIM DA LÓGICA DO PDV ---


/* * =====================================
 * =====================================
 * LÓGICA DA ZONA DE PERIGO (CONFIGURAÇÕES)
 * =====================================
 * ===================================== */

// --- Botões da página de Configurações ---
const pageConfig = document.getElementById('form-config-mercado'); // Usamos um ID da página de config

if (pageConfig) { // Só executa se estiver na página de Configurações
    
    // --- 1. Botão Exportar CSV ---
    // (Não existe no seu HTML, vamos adicionar um ID)
    const btnExportar = document.querySelector('.btn-secondary.btn-danger + .btn-secondary'); // Seletor complexo, melhor adicionar ID
    const btnLimpar = document.getElementById('btn-limpar-sistema');

    // Função para converter dados para CSV
    function convertToCSV(data, headers) {
        const headerRow = headers.join(';');
        const rows = data.map(item => {
            return headers.map(header => {
                let cell = item[header] === null || item[header] === undefined ? '' : item[header];
                cell = String(cell).replace(/"/g, '""'); // Escapa aspas
                if (cell.includes(';') || cell.includes('\n')) {
                    cell = `"${cell}"`; // Coloca aspas se tiver ; ou \n
                }
                return cell;
            }).join(';');
        });
        return [headerRow, ...rows].join('\n');
    }

    // Função para descarregar o CSV
    function downloadCSV(csvString, filename) {
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF para Excel entender acentos
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Tentativa de encontrar o botão de exportar (é melhor adicionar um ID no HTML)
    const btnExportarDados = Array.from(document.querySelectorAll('.danger-zone-card .btn-secondary')).find(btn => btn.textContent.includes('Exportar Dados'));
    
    if (btnExportarDados) {
        btnExportarDados.addEventListener('click', async () => {
            if (!confirm("Deseja descarregar um CSV com todos os produtos e categorias?")) return;
            
            try {
                // 1. Buscar Produtos (usando o cache ou buscando de novo)
                await carregarCacheParaPDV(); // Função do PDV que já carrega o cacheProdutos
                
                if (cacheProdutos.length === 0) {
                    return alert("Nenhum produto encontrado para exportar.");
                }

                // Definimos as colunas que queremos no CSV
                const headers = ['sku', 'nome', 'categoria_nome', 'qtd', 'custo', 'venda', 'estoque_minimo', 'vencimento'];
                const csvData = convertToCSV(cacheProdutos, headers);
                downloadCSV(csvData, 'export_produtos_mercado_bom_d.csv');

            } catch (e) {
                alert("Erro ao exportar dados: " + e.message);
            }
        });
    } else {
        console.warn("Botão de Exportar CSV não encontrado. Adicione um ID 'btn-exportar-csv' no HTML.");
    }

    // --- 2. Botão Limpar Sistema ---
    if (btnLimpar) {
        btnLimpar.addEventListener('click', async () => {
            const confirmacao = prompt("Esta ação é IRREVERSÍVEL. Você perderá todos os seus PRODUTOS e PERDAS.\n\nPara confirmar, digite 'DELETAR' em maiúsculas:");
            
            if (confirmacao !== 'DELETAR') {
                return alert("Ação cancelada.");
            }
            
            alert("Iniciando limpeza... O sistema irá recarregar ao terminar.");
            btnLimpar.disabled = true;
            btnLimpar.textContent = "A limpar...";

            try {
                const empresaId = getEmpresaId();
                const batch = writeBatch(db);

                // 1. Apagar todos os produtos
                const produtosRef = collection(db, "empresas", empresaId, "produtos");
                const produtosSnap = await getDocs(produtosRef);
                produtosSnap.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // 2. Apagar todos os registros de perdas
                const perdasRef = collection(db, "empresas", empresaId, "perdas");
                const perdasSnap = await getDocs(perdasRef);
                perdasSnap.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                
                await logActivity('fas fa-exclamation-triangle', 'red', 'Sistema Limpo', 'Produtos e Perdas foram apagados.');
                alert("Sistema limpo com sucesso!");
                window.location.reload();

            } catch (e) {
                alert("Erro ao limpar o sistema: " + e.message);
                btnLimpar.disabled = false;
                btnLimpar.textContent = "Limpar Sistema";
            }
        });
    }
}