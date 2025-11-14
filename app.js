/* === app.js (VERSÃO FINAL COMPLETA - Multi-Empresa com Firebase) === */

// --- IMPORTS DO FIREBASE (CDN) ---
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
    doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc,
    query, where, Timestamp, serverTimestamp, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
    ref, uploadString, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// --- IMPORTS LOCAIS ---
import { auth, db, storage } from './firebase-config.js';

// --- CONSTANTES GLOBAIS ---
const PLACEHOLDER_IMG = 'https://via.placeholder.com/100';

/* * =====================================
 * FUNÇÃO AUXILIAR: PEGAR ID DA EMPRESA
 * ===================================== */
function getEmpresaId() {
    const empresaId = localStorage.getItem('empresaId');
    if (!empresaId) {
        console.error("ID da Empresa não encontrado! Fazendo logout.");
        window.location.href = 'index.html';
    }
    return empresaId;
}

/* * =====================================
 * FUNÇÃO AUXILIAR: REGISTRAR ATIVIDADE
 * ===================================== */
async function logActivity(icon, color, title, description) {
    try {
        const empresaId = getEmpresaId();
        const perfil = localStorage.getItem('currentProfile') || 'Sistema';
        if (!empresaId) return;

        const newActivity = {
            icon,
            color,
            title,
            description,
            perfil_nome: perfil,
            timestamp: serverTimestamp(), // Usa a hora do servidor
            time_string: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Salva na subcoleção de atividades da empresa
        const atividadesRef = collection(db, "empresas", empresaId, "atividades");
        await addDoc(atividadesRef, newActivity);

    } catch (error) {
        console.error('Falha ao registrar atividade:', error.message);
    }
}


/* * =====================================
 * LÓGICA DE CADASTRO (form-cadastro)
 * ===================================== */
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmaSenha = document.getElementById('confirma-senha').value;

        if (senha !== confirmaSenha) {
            alert("As senhas não conferem!");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Cria um "batch" (pacote) de escritas no banco
            const batch = writeBatch(db);

            // 1. Cria o documento da Empresa
            const empresaDocRef = doc(db, "empresas", user.uid);
            batch.set(empresaDocRef, {
                adminEmail: user.email,
                createdAt: serverTimestamp(),
                nomeMercado: "Meu Mercado",
                estoqueMinimoPadrao: 10
            });

            // 2. Cria o perfil "Admin" padrão dentro da empresa
            const perfilAdminRef = doc(db, "empresas", user.uid, "perfis", "Admin");
            batch.set(perfilAdminRef, {
                nome: "Admin",
                foto_perfil: PLACEHOLDER_IMG
            });

            // Executa todas as operações de uma vez
            await batch.commit();

            alert(`Conta criada com sucesso para ${user.email}! Você será redirecionado para o login.`);
            window.location.href = 'index.html';

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                alert("Erro: Este email já está em uso.");
            } else if (error.code === 'auth/weak-password') {
                alert("Erro: A senha é muito fraca. (Mínimo 6 caracteres)");
            } else {
                alert("Erro ao criar conta: " + error.message);
            }
        }
    });
}

/* * =====================================
 * LÓGICA DE LOGIN (form-login)
 * ===================================== */
const loginForm = document.getElementById('form-login');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            localStorage.setItem('empresaId', user.uid);
            localStorage.removeItem('userToken'); // Limpa o antigo
            localStorage.removeItem('currentProfile'); // Garante que o perfil seja selecionado

            window.location.href = 'perfis.html';

        } catch (error) {
            alert("Erro: Email ou senha incorretos.");
        }
    });
}

/* * =====================================
 * LÓGICA DE LOGOUT (BOTÃO SAIR)
 * ===================================== */
const logoutButton = document.querySelector('.sidebar-footer a');
if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (confirm('Você tem certeza que deseja sair?')) {
            localStorage.removeItem('empresaId');
            localStorage.removeItem('currentProfile');
            window.location.href = 'index.html';
        }
    });
}

/* * =====================================
 * LÓGICA DE CARREGAR DADOS GLOBAIS (NOME/FOTO ADMIN)
 * ===================================== */
const globalHeaderProfileName = document.getElementById('header-profile-name');
const globalHeaderProfilePic = document.getElementById('header-profile-pic');

async function carregarDadosGlobaisUsuario() {
    if (!globalHeaderProfileName || !globalHeaderProfilePic) return; // Só roda em páginas internas

    const empresaId = localStorage.getItem('empresaId'); // Não usa getEmpresaId() para não dar loop de logout
    const currentProfileName = localStorage.getItem('currentProfile');

    if (currentProfileName) {
        globalHeaderProfileName.textContent = currentProfileName;
    } else {
        globalHeaderProfileName.textContent = "Carregando...";
        return; // Sai se o perfil ainda não foi selecionado (ex: na tela perfis.html)
    }

    if (empresaId) {
        try {
            const perfilDocRef = doc(db, "empresas", empresaId, "perfis", currentProfileName);
            const docSnap = await getDoc(perfilDocRef);

            if (docSnap.exists()) {
                const perfilData = docSnap.data();
                if (perfilData.foto_perfil) {
                    globalHeaderProfilePic.src = perfilData.foto_perfil;
                }
            }
        } catch (error) {
            console.error("Erro ao buscar foto do perfil:", error);
            globalHeaderProfilePic.src = 'https://via.placeholder.com/40';
        }
    }
}

/* * =====================================
 * LÓGICA DA TELA DE PERFIS (perfis.html)
 * ===================================== */
const profileGrid = document.getElementById('profile-grid');
if (profileGrid) {
    async function carregarPerfis() {
        const empresaId = getEmpresaId();
        if (!empresaId) return;

        const perfisRef = collection(db, "empresas", empresaId, "perfis");
        try {
            const querySnapshot = await getDocs(perfisRef);
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
        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            profileGrid.innerHTML = '<p>Erro ao carregar perfis.</p>';
        }
    }
    carregarPerfis();
}

/* * =====================================
 * LÓGICA DO MODAL DE CONFIRMAÇÃO (GLOBAL)
 * ===================================== */
const modalOverlay = document.getElementById('delete-modal');
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalBtnConfirm = document.getElementById('modal-btn-confirm');
const modalCloseIcon = document.querySelector('.modal-close-icon');
let deleteConfig = {}; // Objeto para guardar o que deletar

function openModal(config) {
    if (modalOverlay) {
        deleteConfig = config; // Ex: { type: 'categoria', id: '...' } ou { type: 'produto', id: '...' }
        modalOverlay.style.display = 'flex';
    }
}
function closeModal() {
    if (modalOverlay) {
        deleteConfig = {};
        modalOverlay.style.display = 'none';
    }
}

if (modalOverlay) {
    modalBtnCancel.addEventListener('click', closeModal);
    modalCloseIcon.addEventListener('click', closeModal);

    modalBtnConfirm.addEventListener('click', async () => {
        const empresaId = getEmpresaId();
        if (!empresaId || !deleteConfig.type || !deleteConfig.id) {
            closeModal();
            return;
        }

        let docRef;
        let logMessage = "";

        try {
            if (deleteConfig.type === 'categoria') {
                docRef = doc(db, "empresas", empresaId, "categorias", deleteConfig.id);
                logMessage = `Categoria "${deleteConfig.nome || 'desconhecida'}" foi removida.`;
            } else if (deleteConfig.type === 'produto') {
                docRef = doc(db, "empresas", empresaId, "produtos", deleteConfig.id);
                logMessage = `Produto "${deleteConfig.nome || 'desconhecido'}" (SKU: ${deleteConfig.id}) foi removido.`;
            } else if (deleteConfig.type === 'perfil') {
                docRef = doc(db, "empresas", empresaId, "perfis", deleteConfig.id);
                logMessage = `Perfil "${deleteConfig.id}" foi removido.`;
            } else {
                throw new Error("Tipo de exclusão desconhecido");
            }

            await deleteDoc(docRef);
            await logActivity('fas fa-trash-alt', 'red', 'Item Excluído', logMessage);
            
            closeModal();
            
            // Recarrega a lista específica
            if (deleteConfig.type === 'categoria') carregarCategorias();
            if (deleteConfig.type === 'produto') carregarProdutos();
            if (deleteConfig.type === 'perfil') carregarGerenciarPerfis();

        } catch (error) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    });
}


/* * =====================================
 * LÓGICA DE CATEGORIAS (categorias.html)
 * ===================================== */
const formAddCategory = document.getElementById('form-add-categoria');
const categoryList = document.querySelector('.category-list');

async function carregarCategorias() {
    if (!categoryList) return; // Só executa na página de categorias

    const empresaId = getEmpresaId();
    const categoriasRef = collection(db, "empresas", empresaId, "categorias");
    
    try {
        const querySnapshot = await getDocs(categoriasRef);
        categoryList.innerHTML = '';
        
        if (querySnapshot.empty) {
            categoryList.innerHTML = '<li><span>Nenhuma categoria cadastrada.</span></li>';
        }

        let categoriasParaDropdown = []; // Array para popular dropdowns

        querySnapshot.forEach((docSnap) => {
            const categoria = docSnap.data();
            const categoriaId = docSnap.id;
            categoriasParaDropdown.push({ id: categoriaId, nome: categoria.nome });

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${categoria.nome}</span>
                <button class="btn-action delete"><i class="fas fa-trash-alt"></i></button>
            `;
            li.querySelector('.btn-action.delete').addEventListener('click', (e) => {
                e.preventDefault();
                openModal({ type: 'categoria', id: categoriaId, nome: categoria.nome });
            });
            categoryList.appendChild(li);
        });

        // Popula os dropdowns de categoria (ex: em adicionar-produto.html)
        popularDropdownCategorias(categoriasParaDropdown);

    } catch (error) {
        console.error("Erro ao carregar categorias: ", error);
        categoryList.innerHTML = '<li><span>Erro ao carregar categorias.</span></li>';
    }
}

if (formAddCategory) {
    formAddCategory.addEventListener('submit', async (event) => {
        event.preventDefault();
        const categoryNameInput = document.getElementById('nome-categoria');
        const categoryName = categoryNameInput.value.trim();
        const empresaId = getEmpresaId();

        if (!categoryName) return alert('Por favor, digite o nome da categoria.');

        try {
            const categoriasRef = collection(db, "empresas", empresaId, "categorias");
            await addDoc(categoriasRef, { nome: categoryName });
            
            await logActivity('fas fa-tags', 'gray', 'Nova Categoria', `A categoria "${categoryName}" foi criada.`);
            categoryNameInput.value = '';
            carregarCategorias(); // Recarrega a lista
            
        } catch (error) {
            alert(`Erro ao salvar categoria: ${error.message}`);
        }
    });
}

function popularDropdownCategorias(categorias) {
    const selects = document.querySelectorAll('#categoria-produto, #filtro-categoria');
    if (selects.length === 0) return;

    selects.forEach(select => {
        // Guarda a opção "Selecione..." ou "Todas..."
        const placeholderOption = select.querySelector('option');
        select.innerHTML = ''; // Limpa
        select.appendChild(placeholderOption); // Readiciona

        categorias.forEach(cat => {
            const option = document.createElement('option');
            // Usamos o NOME como valor, como no app.js original
            option.value = cat.nome; 
            option.textContent = cat.nome;
            select.appendChild(option);
        });
    });
}


/* * =====================================
 * LÓGICA DE PRODUTOS (adicionar-produto.html)
 * ===================================== */
const formAddProduct = document.getElementById('form-add-product');
if (formAddProduct) {
    formAddProduct.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const empresaId = getEmpresaId();
        const sku = document.getElementById('sku-produto').value;
        if (!sku) return alert("O Código (SKU) é obrigatório!");

        const novoProduto = {
            nome: document.getElementById('nome-produto').value,
            sku: sku,
            categoria_nome: document.getElementById('categoria-produto').value, // Salva o nome da categoria
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value || null,
            estoque_minimo: parseInt(document.getElementById('estoque-minimo').value) || 10,
            createdAt: serverTimestamp()
        };

        try {
            // Usamos o SKU como ID do documento
            const produtoRef = doc(db, "empresas", empresaId, "produtos", sku);
            
            // Verifica se já existe
            const docSnap = await getDoc(produtoRef);
            if (docSnap.exists()) {
                throw new Error(`O SKU "${sku}" já está cadastrado.`);
            }

            // Cria o produto
            await setDoc(produtoRef, novoProduto);

            await logActivity('fas fa-box', 'blue', 'Novo Produto', `"${novoProduto.nome}" (SKU: ${sku}) foi cadastrado.`);
            alert('Produto "' + novoProduto.nome + '" cadastrado com sucesso!');
            window.location.href = 'produtos.html';
        } catch (error) {
            alert(`Erro ao cadastrar produto: ${error.message}`);
        }
    });
}

/* * =====================================
 * LÓGICA DE PRODUTOS (produtos.html - Listar)
 * ===================================== */
const productTableBody = document.getElementById('product-table-body');
let cacheProdutos = []; // Cache local para filtros e autocomplete

async function carregarProdutos() {
    if (!productTableBody) return; // Só roda na página de produtos
    
    const empresaId = getEmpresaId();
    const produtosRef = collection(db, "empresas", empresaId, "produtos");
    
    try {
        const querySnapshot = await getDocs(produtosRef);
        cacheProdutos = []; // Limpa o cache
        productTableBody.innerHTML = '';

        if (querySnapshot.empty) {
            productTableBody.innerHTML = '<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';
        }

        querySnapshot.forEach(docSnap => {
            const produto = docSnap.data();
            cacheProdutos.push(produto); // Adiciona ao cache
            
            const tr = document.createElement('tr');
            const precoVenda = parseFloat(produto.venda) || 0;
            const emEstoqueBaixo = produto.qtd <= produto.estoque_minimo;

            tr.innerHTML = `
                <td>${produto.sku}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria_nome || 'Sem Categoria'}</td>
                <td><span class="${emEstoqueBaixo ? 'stock-low' : 'stock-ok'}">${produto.qtd}</span></td>
                <td>R$ ${precoVenda.toFixed(2)}</td>
                <td>
                    <button class="btn-action edit" data-sku="${produto.sku}">Editar</button>
                    <button class="btn-action delete" data-sku="${produto.sku}">Excluir</button>
                </td>
            `;
            productTableBody.appendChild(tr);

            // Adiciona eventos aos botões
            tr.querySelector('.btn-action.delete').addEventListener('click', () => {
                openModal({ type: 'produto', id: produto.sku, nome: produto.nome });
            });
            tr.querySelector('.btn-action.edit').addEventListener('click', () => {
                window.location.href = `editar-produto.html?sku=${produto.sku}`;
            });
        });
        
        // Atualiza o dashboard com a contagem correta
        carregarDashboard();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productTableBody.innerHTML = `<tr><td colspan="6">Erro ao carregar produtos: ${error.message}</td></tr>`;
    }
}


/* * =====================================
 * LÓGICA DE PRODUTOS (editar-produto.html)
 * ===================================== */
const formEditProduct = document.getElementById('form-edit-product');
if (formEditProduct) {
    const urlParams = new URLSearchParams(window.location.search);
    const skuParaEditar = urlParams.get('sku');
    
    // 1. Carrega os dados do produto no formulário
    async function carregarProdutoParaEditar() {
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
                // Formata a data para YYYY-MM-DD
                document.getElementById('data-vencimento').value = p.vencimento ? p.vencimento.split('T')[0] : '';
                document.getElementById('estoque-minimo').value = p.estoque_minimo;
            } else {
                alert('Erro: Produto não encontrado.');
                window.location.href = 'produtos.html';
            }
        } catch (error) {
            alert('Erro ao carregar dados do produto.');
        }
    }
    
    // 2. Salva as alterações
    formEditProduct.addEventListener('submit', async function(event) {
        event.preventDefault();
        
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
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    });

    carregarProdutoParaEditar();
}

/* * =====================================
 * LÓGICA DE FILTRO DE PRODUTOS (produtos.html)
 * ===================================== */
const filtroBuscaInput = document.getElementById('filtro-busca');
const filtroCategoriaSelect = document.getElementById('filtro-categoria');

function aplicarFiltrosDeProduto() {
    if (!productTableBody) return; // Só roda na página de produtos

    const termoBusca = filtroBuscaInput ? filtroBuscaInput.value.toLowerCase() : '';
    const categoriaSelecionada = filtroCategoriaSelect ? filtroCategoriaSelect.value : '';

    const produtosFiltrados = cacheProdutos.filter(produto => {
        const matchBusca = (produto.nome.toLowerCase().includes(termoBusca) ||
                           produto.sku.toLowerCase().includes(termoBusca));
        const matchCategoria = (categoriaSelecionada === "") || (produto.categoria_nome === categoriaSelecionada);
        return matchBusca && matchCategoria;
    });

    // Renderiza a tabela apenas com os produtos filtrados
    productTableBody.innerHTML = ''; // Limpa
    if (produtosFiltrados.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="6">Nenhum produto encontrado com esses filtros.</td></tr>';
        return;
    }
    
    produtosFiltrados.forEach(produto => {
        const tr = document.createElement('tr');
        const precoVenda = parseFloat(produto.venda) || 0;
        const emEstoqueBaixo = produto.qtd <= produto.estoque_minimo;
        tr.innerHTML = `
            <td>${produto.sku}</td>
            <td>${produto.nome}</td>
            <td>${produto.categoria_nome || 'Sem Categoria'}</td>
            <td><span class="${emEstoqueBaixo ? 'stock-low' : 'stock-ok'}">${produto.qtd}</span></td>
            <td>R$ ${precoVenda.toFixed(2)}</td>
            <td>
                <button class="btn-action edit" data-sku="${produto.sku}">Editar</button>
                <button class="btn-action delete" data-sku="${produto.sku}">Excluir</button>
            </td>
        `;
        productTableBody.appendChild(tr);
        tr.querySelector('.btn-action.delete').addEventListener('click', () => {
            openModal({ type: 'produto', id: produto.sku, nome: produto.nome });
        });
        tr.querySelector('.btn-action.edit').addEventListener('click', () => {
            window.location.href = `editar-produto.html?sku=${produto.sku}`;
        });
    });
}
if (filtroBuscaInput) filtroBuscaInput.addEventListener('keyup', aplicarFiltrosDeProduto);
if (filtroCategoriaSelect) filtroCategoriaSelect.addEventListener('change', aplicarFiltrosDeProduto);


/* * =====================================
 * LÓGICA DE AUTO-COMPLETAR (ENTRADA E SAÍDA)
 * ===================================== */
const searchInput = document.getElementById('buscar-produto');
const suggestionsBox = document.getElementById('suggestions-box');
const skuSelecionadoInput = document.getElementById('produto-sku-selecionado');
const qtdAtualInput = document.getElementById('produto-qtd-atual');
const vencimentoSelecionadoInput = document.getElementById('produto-vencimento');

if (searchInput) {
    // Carrega o cache de produtos se estiver vazio
    searchInput.addEventListener('focus', async () => {
        if (cacheProdutos.length === 0) {
            const empresaId = getEmpresaId();
            const produtosRef = collection(db, "empresas", empresaId, "produtos");
            const querySnapshot = await getDocs(produtosRef);
            querySnapshot.forEach(docSnap => cacheProdutos.push(docSnap.data()));
        }
    });

    searchInput.addEventListener('keyup', (e) => {
        const termoBusca = searchInput.value.toLowerCase();
        if (termoBusca.length < 1) {
            suggestionsBox.style.display = 'none';
            return;
        }
        
        const sugestoes = cacheProdutos.filter(p => 
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
                        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
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
 * LÓGICA DE REGISTRAR ENTRADA
 * ===================================== */
const formEntrada = document.getElementById('form-add-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', async (event) => {
        event.preventDefault();
        const empresaId = getEmpresaId();
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaAdicionar = parseInt(document.getElementById('quantidade').value) || 0;
        
        if (!skuParaAtualizar || quantidadeParaAdicionar <= 0) {
            return alert('Erro: Selecione um produto e insira uma quantidade válida.');
        }

        try {
            const produtoRef = doc(db, "empresas", empresaId, "produtos", skuParaAtualizar);
            
            // Usa 'increment' para adicionar valor sem risco de 'race condition'
            await updateDoc(produtoRef, {
                qtd: increment(quantidadeParaAdicionar)
            });
            
            await logActivity('fas fa-arrow-down', 'green', 'Entrada de Estoque', `+${quantidadeParaAdicionar} unidades de "${searchInput.value}" (SKU: ${skuParaAtualizar})`);
            alert(`Entrada registrada com sucesso!`);
            window.location.href = 'produtos.html'; 
        } catch (error) {
            alert(`Erro ao registrar entrada: ${error.message}`);
        }
    });
}


/* * =====================================
 * LÓGICA DE REGISTRAR SAÍDA (PERDA/AJUSTE)
 * ===================================== */
const formSaida = document.getElementById('form-add-saida');
if (formSaida) {
    formSaida.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const empresaId = getEmpresaId();
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaRemover = parseInt(document.getElementById('quantidade-saida').value) || 0;
        const motivo = document.getElementById('motivo-saida').value; 
        const observacao = document.getElementById('observacao').value;

        if (!skuParaAtualizar || quantidadeParaRemover <= 0) {
            return alert('Erro: Selecione um produto, quantidade e motivo válidos.');
        }

        const produto = cacheProdutos.find(p => p.sku === skuParaAtualizar);
        if (!produto) return alert('Erro: Produto selecionado não encontrado no cache.');
        
        const qtdAntiga = parseInt(produto.qtd) || 0;
        if (quantidadeParaRemover > qtdAntiga) {
            return alert(`Erro: Você não pode remover ${quantidadeParaRemover} unidades. O estoque atual é ${qtdAntiga}.`);
        }

        const custoTotalPerda = (parseFloat(produto.custo) || 0) * quantidadeParaRemover;

        try {
            const batch = writeBatch(db);

            // 1. Remove do estoque
            const produtoRef = doc(db, "empresas", empresaId, "produtos", skuParaAtualizar);
            batch.update(produtoRef, {
                qtd: increment(-quantidadeParaRemover) // Subtrai
            });

            // 2. Registra na coleção de "perdas"
            const perdasRef = collection(db, "empresas", empresaId, "perdas");
            batch.set(doc(perdasRef), {
                sku: skuParaAtualizar,
                nome_produto: produto.nome,
                qtd: quantidadeParaRemover,
                motivo: motivo,
                observacao: observacao,
                custo_total: custoTotalPerda,
                data_perda: serverTimestamp()
            });
            
            // Executa as duas operações
            await batch.commit();
            
            await logActivity('fas fa-arrow-up', 'red', `Saída (${motivo})`, `-${quantidadeParaRemover} unidades de "${produto.nome}"`);
            alert(`Saída registrada com sucesso!`);
            window.location.href = 'produtos.html'; 
        } catch (error) {
            alert(`Erro ao registrar saída: ${error.message}`);
        }
    });
}


/* * =====================================
 * LÓGICA DE FECHAMENTO DE CAIXA
 * ===================================== */
const formFechamento = document.getElementById('form-fechamento');
const dataField = document.getElementById('data-fechamento');
if (dataField) {
    const hoje = new Date();
    // Formato YYYY-MM-DD para ID
    const dataFormatadaID = hoje.toISOString().split('T')[0];
    dataField.value = dataFormatadaID; // Mostra no input
}

if (formFechamento) {
    formFechamento.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const empresaId = getEmpresaId();
        const dataID = dataField.value; // YYYY-MM-DD
        if (!dataID) return alert("Data inválida!");

        const fechamento = {
            dinheiro: parseFloat(document.getElementById('total-dinheiro').value) || 0,
            cartao: parseFloat(document.getElementById('total-cartao').value) || 0,
            pix: parseFloat(document.getElementById('total-pix').value) || 0,
            data_fechamento: dataID,
            timestamp: Timestamp.fromDate(new Date(dataID + "T12:00:00")) // Salva com data
        };
        fechamento.total = fechamento.dinheiro + fechamento.cartao + fechamento.pix;

        try {
            // Usamos a DATA como ID
            const fechamentoRef = doc(db, "empresas", empresaId, "fechamentos", dataID);
            
            const docSnap = await getDoc(fechamentoRef);
            if(docSnap.exists()) {
                if(!confirm("O caixa para esta data já foi fechado. Deseja sobrescrever?")) {
                    return;
                }
            }

            await setDoc(fechamentoRef, fechamento); // Cria ou Sobrescreve
            
            await logActivity('fas fa-wallet', 'yellow', 'Fechamento de Caixa', `Caixa de ${dataID} fechado com R$ ${fechamento.total.toFixed(2)}.`);
            alert('Fechamento do dia salvo com sucesso! Total: R$ ' + fechamento.total.toFixed(2));
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert(`Erro ao salvar fechamento: ${error.message}`);
        }
    });
}


/* * =====================================
 * LÓGICA DO DASHBOARD (Cards e Atividades)
 * ===================================== */
const statsGrid = document.querySelector('.stats-grid');
async function carregarDashboard() {
    if (!statsGrid) return; // Só roda no dashboard
    
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    // Elementos dos Cards
    const totalProdutosCard = statsGrid.querySelector('.stat-icon.green + .stat-info strong');
    const vendasDiaCard = statsGrid.querySelector('.stat-icon.yellow + .stat-info strong');
    const valorVendasMesCard = statsGrid.querySelector('.stat-icon.blue + .stat-info strong');
    const estoqueMinimoCard = statsGrid.querySelector('.stat-icon.red + .stat-info strong');
    
    try {
        // --- 1. Total de Produtos ---
        const produtosRef = collection(db, "empresas", empresaId, "produtos");
        const produtosSnap = await getDocs(produtosRef);
        if (totalProdutosCard) totalProdutosCard.textContent = produtosSnap.size;

        // --- 2. Estoque Baixo ---
        let totalEstoqueBaixo = 0;
        produtosSnap.forEach(docSnap => {
            const p = docSnap.data();
            if (p.qtd <= p.estoque_minimo) {
                totalEstoqueBaixo++;
            }
        });
        if (estoqueMinimoCard) estoqueMinimoCard.textContent = totalEstoqueBaixo;

        // --- 3. Vendas do Dia e Mês ---
        const fechamentosRef = collection(db, "empresas", empresaId, "fechamentos");
        const fechamentosSnap = await getDocs(fechamentosRef);

        const hoje = new Date();
        const hojeID = hoje.toISOString().split('T')[0];
        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();
        
        let totalVendasDia = 0;
        let totalVendasMes = 0;

        fechamentosSnap.forEach(docSnap => {
            const v = docSnap.data();
            const [ano, mes, dia] = v.data_fechamento.split('-').map(Number);

            // Vendas do Dia
            if (v.data_fechamento === hojeID) {
                totalVendasDia = v.total;
            }
            // Vendas do Mês
            if (ano === anoAtual && mes === mesAtual) {
                totalVendasMes += v.total;
            }
        });
        
        if (vendasDiaCard) vendasDiaCard.textContent = `R$ ${totalVendasDia.toFixed(2)}`;
        if (valorVendasMesCard) valorVendasMesCard.textContent = `R$ ${totalVendasMes.toFixed(2)}`;

    } catch (error) {
        console.error("Erro no Dashboard:", error);
        if (totalProdutosCard) totalProdutosCard.textContent = "Erro!";
    }

    // --- 4. Extrato de Atividades ---
    const activityFeedList = document.getElementById('activity-feed-list');
    if (activityFeedList) {
        try {
            const atividadesRef = collection(db, "empresas", empresaId, "atividades");
            // Pedimos os 10 mais recentes
            const q = query(atividadesRef, where("timestamp", "<=", new Date()), 10);
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
        } catch (error) {
            console.error("Erro ao carregar atividades:", error);
            activityFeedList.innerHTML = '<li class="feed-item"><span>Erro ao carregar atividades.</span></li>';
        }
    }
}


/* * =====================================
 * LÓGICA DOS RELATÓRIOS (Vendas, Estoque Baixo, Inventário, Perdas)
 * ===================================== */

// Relatório: Vendas Diárias
const salesReportBody = document.getElementById('sales-report-body');
if (salesReportBody) {
    async function carregarRelatorioVendas() {
        const empresaId = getEmpresaId();
        const fechamentosRef = collection(db, "empresas", empresaId, "fechamentos");
        try {
            const querySnapshot = await getDocs(fechamentosRef); // Ordenar por data
            salesReportBody.innerHTML = '';
            if (querySnapshot.empty) {
                salesReportBody.innerHTML = '<tr><td colspan="5">Nenhum fechamento registrado.</td></tr>';
            }
            querySnapshot.forEach(docSnap => {
                const v = docSnap.data();
                const [ano, mes, dia] = v.data_fechamento.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${dataFormatada}</strong></td>
                    <td class="total-col">R$ ${parseFloat(v.total).toFixed(2)}</td>
                    <td>R$ ${parseFloat(v.cartao).toFixed(2)}</td>
                    <td>R$ ${parseFloat(v.dinheiro).toFixed(2)}</td>
                    <td>R$ ${parseFloat(v.pix).toFixed(2)}</td>
                `;
                salesReportBody.appendChild(tr);
            });
        } catch (e) { console.error(e); salesReportBody.innerHTML = `<tr><td colspan="5">Erro ao carregar.</td></tr>`; }
    }
    carregarRelatorioVendas();
}

// Relatório: Estoque Baixo
const stockLowReportBody = document.getElementById('stock-low-report-body');
if (stockLowReportBody) {
    async function carregarEstoqueBaixo() {
        const empresaId = getEmpresaId();
        // Query: "qtd" <= "estoque_minimo"
        // Firestore não permite comparar dois campos. Temos que fazer no cliente.
        const produtosRef = collection(db, "empresas", empresaId, "produtos");
        try {
            const querySnapshot = await getDocs(produtosRef);
            stockLowReportBody.innerHTML = '';
            let count = 0;
            querySnapshot.forEach(docSnap => {
                const p = docSnap.data();
                if (p.qtd <= p.estoque_minimo) {
                    count++;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${p.sku}</td>
                        <td>${p.nome}</td>
                        <td>${p.categoria_nome}</td>
                        <td><span class="stock-low">${p.qtd}</span></td>
                        <td>${p.estoque_minimo}</td>
                    `;
                    stockLowReportBody.appendChild(tr);
                }
            });
            if (count === 0) {
                stockLowReportBody.innerHTML = '<tr><td colspan="5">Nenhum item com estoque baixo.</td></tr>';
            }
        } catch (e) { console.error(e); stockLowReportBody.innerHTML = `<tr><td colspan="5">Erro ao carregar.</td></tr>`; }
    }
    carregarEstoqueBaixo();
}

// Relatório: Inventário (Valor)
const inventoryReportBody = document.getElementById('inventory-report-body');
if (inventoryReportBody) {
    async function carregarInventario() {
        const empresaId = getEmpresaId();
        const produtosRef = collection(db, "empresas", empresaId, "produtos");
        try {
            const querySnapshot = await getDocs(produtosRef);
            inventoryReportBody.innerHTML = '';
            let grandTotal = 0;
            querySnapshot.forEach(docSnap => {
                const p = docSnap.data();
                const itemTotal = (parseFloat(p.custo) || 0) * (parseInt(p.qtd) || 0);
                grandTotal += itemTotal;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.nome}</td>
                    <td>${p.qtd}</td>
                    <td>R$ ${parseFloat(p.custo).toFixed(2)}</td>
                    <td class="total-col">R$ ${itemTotal.toFixed(2)}</td>
                `;
                inventoryReportBody.appendChild(tr);
            });
            const totalFooter = document.getElementById('inventory-total-footer');
            if (totalFooter) totalFooter.textContent = `R$ ${grandTotal.toFixed(2)}`;
            if (querySnapshot.empty) {
                inventoryReportBody.innerHTML = '<tr><td colspan="4">Nenhum produto cadastrado.</td></tr>';
            }
        } catch (e) { console.error(e); inventoryReportBody.innerHTML = `<tr><td colspan="4">Erro ao carregar.</td></tr>`; }
    }
    carregarInventario();
}

// Relatório: Perdas e Ajustes
const lossesReportBody = document.getElementById('losses-report-body');
if (lossesReportBody) {
    async function carregarPerdas() {
        const empresaId = getEmpresaId();
        const perdasRef = collection(db, "empresas", empresaId, "perdas");
        try {
            const querySnapshot = await getDocs(perdasRef); // Ordenar por data
            lossesReportBody.innerHTML = '';
            let totalPerdas = 0;
            querySnapshot.forEach(docSnap => {
                const p = docSnap.data();
                const custoPerda = parseFloat(p.custo_total) || 0;
                totalPerdas += custoPerda;
                // Formata data
                const dataJS = p.data_perda.toDate();
                const dataFormatada = dataJS.toLocaleDateString('pt-BR');
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td>${p.nome_produto}</td>
                    <td>${p.qtd}</td>
                    <td>${p.motivo}</td>
                    <td class="stock-low">R$ ${custoPerda.toFixed(2)}</td>
                `;
                lossesReportBody.appendChild(tr);
            });
            const totalLossesFooter = document.getElementById('losses-total-footer');
            if (totalLossesFooter) totalLossesFooter.textContent = `R$ ${totalPerdas.toFixed(2)}`;
            if (querySnapshot.empty) {
                lossesReportBody.innerHTML = '<tr><td colspan="5">Nenhum registro de perda ou ajuste.</td></tr>';
            }
        } catch (e) { console.error(e); lossesReportBody.innerHTML = `<tr><td colspan="5">Erro ao carregar.</td></tr>`; }
    }
    carregarPerdas();
}


/* * =====================================
 * LÓGICA DE CONFIGURAÇÕES (configuracoes.html)
 * ===================================== */
const formConfigMercado = document.getElementById('form-config-mercado');
const formAddPerfil = document.getElementById('form-add-perfil');
const profileList = document.getElementById('profile-list');

// Carrega dados da empresa e lista de perfis
async function carregarGerenciarPerfis() {
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    // 1. Carrega dados do mercado (form)
    if (formConfigMercado) {
        try {
            const empresaRef = doc(db, "empresas", empresaId);
            const docSnap = await getDoc(empresaRef);
            if (docSnap.exists()) {
                const config = docSnap.data();
                document.getElementById('nome-mercado').value = config.nomeMercado || 'Meu Mercado';
                document.getElementById('cnpj').value = config.cnpj || '';
                document.getElementById('estoque-minimo').value = config.estoqueMinimoPadrao || 10;
            }
        } catch (e) { console.error("Erro ao carregar config do mercado", e); }
    }

    // 2. Carrega a lista de perfis (ul)
    if (profileList) {
        try {
            const perfisRef = collection(db, "empresas", empresaId, "perfis");
            const querySnapshot = await getDocs(perfisRef);
            profileList.innerHTML = '';

            querySnapshot.forEach(docSnap => {
                const perfil = docSnap.data();
                const perfilId = docSnap.id; // O ID é o NOME

                const li = document.createElement('li');
                li.className = 'profile-item';
                li.innerHTML = `
                    <img src="${perfil.foto_perfil || PLACEHOLDER_IMG}" alt="${perfil.nome}" class="dropdown-avatar">
                    <span>${perfil.nome}</span>
                    <button class="btn-action edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-action delete"><i class="fas fa-trash-alt"></i></button>
                `;
                profileList.appendChild(li);

                li.querySelector('.btn-action.edit').addEventListener('click', () => {
                    window.location.href = `editar-perfil.html?id=${perfilId}`;
                });
                li.querySelector('.btn-action.delete').addEventListener('click', () => {
                    if (perfil.nome === 'Admin') {
                        return alert('Não é possível excluir o perfil "Admin" principal.');
                    }
                    if (perfil.nome === localStorage.getItem('currentProfile')) {
                        return alert('Não é possível excluir o perfil em que você está logado.');
                    }
                    openModal({ type: 'perfil', id: perfilId });
                });
            });
        } catch (e) { console.error("Erro ao carregar lista de perfis", e); }
    }
}

// Salvar Configurações do Mercado
if (formConfigMercado) {
    formConfigMercado.addEventListener('submit', async (event) => {
        event.preventDefault();
        const empresaId = getEmpresaId();
        const empresaRef = doc(db, "empresas", empresaId);
        
        const config = {
            nomeMercado: document.getElementById('nome-mercado').value,
            cnpj: document.getElementById('cnpj').value,
            estoqueMinimoPadrao: parseInt(document.getElementById('estoque-minimo').value) || 10
        };

        try {
            await updateDoc(empresaRef, config);
            alert('Configurações do Mercado salvas com sucesso!');
        } catch (e) { alert('Erro ao salvar configurações: ' + e.message); }
    });
}

// Adicionar Novo Perfil
if (formAddPerfil) {
    formAddPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();
        const empresaId = getEmpresaId();
        const input = document.getElementById('nome-perfil');
        const nome = input.value.trim();
        if (!nome) return;

        try {
            // Usa o NOME como ID
            const perfilRef = doc(db, "empresas", empresaId, "perfis", nome);
            const docSnap = await getDoc(perfilRef);
            if(docSnap.exists()) {
                return alert("Erro: Já existe um perfil com este nome.");
            }

            await setDoc(perfilRef, {
                nome: nome,
                foto_perfil: PLACEHOLDER_IMG
            });
            
            await logActivity('fas fa-user-plus', 'blue', 'Novo Perfil', `O perfil "${nome}" foi criado.`);
            input.value = '';
            carregarGerenciarPerfis(); // Recarrega a lista
        } catch (e) { alert('Erro ao adicionar perfil: ' + e.message); }
    });
}


/* * =====================================
 * LÓGICA DE EDITAR PERFIL (editar-perfil.html)
 * ===================================== */
const formEditPerfil = document.getElementById('form-edit-perfil');
if (formEditPerfil) {
    const urlParams = new URLSearchParams(window.location.search);
    const perfilId = urlParams.get('id'); // O ID é o nome
    const preview = document.getElementById('profile-pic-preview');
    const nomeInput = document.getElementById('nome-perfil');
    const fotoInput = document.getElementById('profile-pic-input');
    const removeBtn = document.getElementById('profile-pic-remove');
    let fotoBase64 = null; // Guarda a foto nova
    let fotoAtualURL = null; // Guarda a foto antiga

    // 1. Carrega os dados
    async function carregarPerfilParaEditar() {
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
                
                // Não deixa editar o nome do 'Admin'
                if (perfil.nome === 'Admin') {
                    nomeInput.disabled = true;
                }
            }
        } catch (e) { alert('Erro ao carregar perfil: ' + e.message); }
    }

    // 2. Lógica de redimensionar e ler a imagem
    fotoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const resizedBase64 = await resizeAndEncodeImage(file, 200, 200, 0.8);
            preview.src = resizedBase64;
            fotoBase64 = resizedBase64; // Salva o base64 para upload
        } catch (e) { alert('Erro ao processar imagem. Tente JPG ou PNG.'); }
    });

    removeBtn.addEventListener('click', () => {
        preview.src = PLACEHOLDER_IMG;
        fotoBase64 = "REMOVER"; // Sinaliza que a foto deve ser removida
        fotoInput.value = null;
    });

    // 3. Salva o perfil
    formEditPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();
        const empresaId = getEmpresaId();
        const nomeAntigo = perfilId;
        const nomeNovo = nomeInput.value.trim();
        
        if (nomeNovo !== nomeAntigo) {
           return alert("Erro: A mudança de nome de perfis não é permitida. Exclua e crie um novo.");
           // Mudar nome (ID) no Firestore é complexo, evitamos por enquanto.
        }

        try {
            let urlParaSalvar = fotoAtualURL; // Começa com a URL antiga

            // Se uma nova foto foi carregada (base64)
            if (fotoBase64 && fotoBase64 !== "REMOVER") {
                // Caminho no Storage: empresas/{empresaId}/perfis/{perfilId}.jpg
                const storageRef = ref(storage, `empresas/${empresaId}/perfis/${perfilId}.jpg`);
                // Faz upload da string base64
                const snapshot = await uploadString(storageRef, fotoBase64, 'data_url');
                // Pega a nova URL de download
                urlParaSalvar = await getDownloadURL(snapshot.ref);
            }
            // Se o usuário clicou em "Remover"
            else if (fotoBase64 === "REMOVER") {
                urlParaSalvar = PLACEHOLDER_IMG; // Salva a placeholder
                // (Opcional: deletar a foto antiga do storage)
                if (fotoAtualURL && fotoAtualURL.includes('firebasestorage')) {
                    const oldStorageRef = ref(storage, fotoAtualURL);
                    try { await deleteObject(oldStorageRef); } catch(e) { console.warn("Foto antiga não existia ou falhou ao deletar", e); }
                }
            }
            
            // Atualiza o documento no Firestore
            const perfilRef = doc(db, "empresas", empresaId, "perfis", perfilId);
            await updateDoc(perfilRef, {
                nome: nomeNovo,
                foto_perfil: urlParaSalvar
            });

            await logActivity('fas fa-user-edit', 'blue', 'Perfil Editado', `O perfil "${nomeNovo}" foi atualizado.`);
            alert('Perfil salvo com sucesso!');
            window.location.href = 'configuracoes.html';

        } catch (e) { alert('Erro ao salvar o perfil: ' + e.message); }
    });

    carregarPerfilParaEditar();
}

// Função auxiliar de Redimensionar Imagem (do seu app.js original)
function resizeAndEncodeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
            img.src = event.target.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}


/* * =====================================
 * LÓGICA DA PESQUISA GLOBAL (Header)
 * ===================================== */
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
        const sugestoes = paginasDoSite.filter(p => p.nome.toLowerCase().includes(termoBusca));
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
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.search-bar')) {
            globalSearchResults.style.display = 'none';
        }
    });
}


/* * =====================================
 * INICIALIZAÇÃO DA PÁGINA (CHAMA OS CARREGADORES)
 * ===================================== */
// Bloco executado em todas as páginas internas

// 1. Carrega o nome do perfil no topo e o botão de "Sair"
carregarDadosGlobaisUsuario();

// 2. Tenta carregar o dashboard (só vai rodar na dashboard.html)
carregarDashboard();

// 3. Tenta carregar as categorias (só vai rodar na categorias.html e páginas de produto)
carregarCategorias();

// 4. Tenta carregar os produtos (só vai rodar na produtos.html)
carregarProdutos();

// 5. Tenta carregar os perfis (só vai rodar na configuracoes.html)
carregarGerenciarPerfis();