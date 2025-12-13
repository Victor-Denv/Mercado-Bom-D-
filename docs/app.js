/* === app.js (VERSÃO FINAL CORRIGIDA - COM SETUP LOGOUT) === */

// 1. IMPORTAÇÕES
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import { 
    collection, addDoc, setDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, 
    query, where, orderBy, limit, serverTimestamp, increment, writeBatch 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { auth, db } from './firebase-config.js';

// 2. CONSTANTES
const PLACEHOLDER_IMG = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNKfj6RsyRZqO4nnWkPFrYMmgrzDmyG31pFQ&s';
let cacheProdutos = [];
let deleteConfig = {};

/* ==================================================================
   3. FUNÇÕES GERAIS (DEFINIDAS PRIMEIRO)
   ================================================================== */

function getEmpresaId() {
    const empresaId = localStorage.getItem('empresaId');
    if (!empresaId) console.warn("ID da Empresa não encontrado.");
    return empresaId;
}

// Função para fazer logout (CORREÇÃO: AGORA ELA EXISTE)
function setupLogout() {
    const btn = document.querySelector('.sidebar-footer a');
    if (!btn) return;
    
    // Removemos listeners antigos clonando o botão
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm("Sair do sistema?")) {
            await signOut(auth);
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

async function logActivity(icon, color, title, description) {
    try {
        const empresaId = getEmpresaId();
        const perfil = localStorage.getItem('currentProfile') || 'Sistema';
        if (!empresaId) return;
        await addDoc(collection(db, "empresas", empresaId, "atividades"), {
            icon, color, title, description,
            perfil_nome: perfil,
            timestamp: serverTimestamp(),
            time_string: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
    } catch (e) { console.error('Log erro:', e.message); }
}

async function carregarHeaderUsuario() {
    const nomeEl = document.getElementById('header-profile-name');
    const picEl = document.getElementById('header-profile-pic');
    const perfil = localStorage.getItem('currentProfile');
    const uid = auth.currentUser ? auth.currentUser.uid : null;
    const empresaId = getEmpresaId();

    if (nomeEl && perfil) nomeEl.textContent = perfil;
    
    if (uid && perfil && picEl && empresaId) {
        try {
            const docSnap = await getDoc(doc(db, "empresas", empresaId, "perfis", perfil));
            if (docSnap.exists()) {
                picEl.src = docSnap.data().foto_perfil || PLACEHOLDER_IMG;
            }
        } catch (e) { console.log("Erro foto header", e); }
    }
}

function setupGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const results = document.getElementById('global-search-results');
    if (!input) return;

    const paginas = [
        { nome: 'Dashboard', url: 'dashboard.html', icone: 'fas fa-home' },
        { nome: 'Produtos', url: 'produtos.html', icone: 'fas fa-box' },
        { nome: 'Devedores', url: 'devedores.html', icone: 'fas fa-user-clock' },
        { nome: 'Vendas', url: 'relatorios-vendas.html', icone: 'fas fa-chart-bar' },
        { nome: 'Configurações', url: 'configuracoes.html', icone: 'fas fa-cog' },
        { nome: 'PDV / Caixa', url: 'pdv.html', icone: 'fas fa-cash-register' }
    ];

    input.addEventListener('keyup', (e) => {
        const termo = input.value.toLowerCase();
        if (termo.length < 2) {
            if(results) results.style.display = 'none';
            return;
        }
        
        const filtrados = paginas.filter(p => p.nome.toLowerCase().includes(termo));
        
        if (results) {
            results.innerHTML = '';
            filtrados.forEach(p => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<i class="${p.icone}"></i> ${p.nome}`;
                div.onclick = () => window.location.href = p.url;
                results.appendChild(div);
            });
            results.style.display = filtrados.length > 0 ? 'block' : 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (results && !input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
        }
    });
}

async function carregarDropdownPerfis() {
    const list = document.getElementById('profile-dropdown-list');
    if (!list) return;
    const empresaId = getEmpresaId();
    if(!empresaId) return;

    try {
        const snap = await getDocs(query(collection(db, "empresas", empresaId, "perfis"), orderBy("nome")));
        list.innerHTML = '';
        snap.forEach(d => {
            const p = d.data();
            const a = document.createElement('a');
            a.href = "#";
            a.innerHTML = `<img src="${p.foto_perfil || PLACEHOLDER_IMG}" class="dropdown-avatar"> ${p.nome}`;
            a.onclick = () => {
                localStorage.setItem('currentProfile', p.nome);
                location.reload();
            };
            list.appendChild(a);
        });
        
        // Link de Sair
        const sair = document.createElement('a');
        sair.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
        sair.style.borderTop = "1px solid #eee";
        sair.style.marginTop = "5px";
        sair.onclick = async () => {
            if(confirm("Sair do sistema?")) {
                await signOut(auth);
                localStorage.clear();
                window.location.href = 'index.html';
            }
        };
        list.appendChild(sair);
    } catch(e) { console.error(e); }
}

/* ==================================================================
   4. FUNÇÕES ESPECÍFICAS (DEVEDORES)
   ================================================================== */

function setupDevedores() {
    const form = document.getElementById('form-add-devedor');
    if (!form) return;

    const campoData = document.getElementById('data-divida');
    if (campoData && !campoData.value) {
        // Formato YYYY-MM-DD
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        campoData.value = `${ano}-${mes}-${dia}`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        
        const devedor = {
            nome: document.getElementById('nome-devedor').value,
            valor: parseFloat(document.getElementById('valor-divida').value),
            data_divida: document.getElementById('data-divida').value,
            descricao: document.getElementById('descricao-divida').value,
            criadoEm: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "empresas", empresaId, "devedores"), devedor);
            await logActivity('fas fa-user-clock', 'red', 'Novo Fiado', `Cliente: ${devedor.nome}`);
            alert("Dívida salva com sucesso!");
            form.reset();
            if(campoData) {
                 const h = new Date();
                 campoData.value = `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
            }
            carregarDevedores(); 
        } catch (error) { alert("Erro ao salvar: " + error.message); }
    });
}

async function carregarDevedores() {
    const tbody = document.getElementById('lista-devedores-body');
    if (!tbody) return;
    const empresaId = getEmpresaId();
    if(!empresaId) return;

    try {
        // Busca SEM ordenação primeiro para garantir que carrega tudo
        const devedoresRef = collection(db, "empresas", empresaId, "devedores");
        const snap = await getDocs(devedoresRef);
        
        tbody.innerHTML = "";
        if (snap.empty) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center'>Nenhum devedor registrado.</td></tr>";
            return;
        }

        snap.forEach(docSnap => {
            const d = docSnap.data();
            
            // Tenta pegar a data de várias formas
            let dataF = '-';
            if (d.data_divida) {
                dataF = d.data_divida.split('-').reverse().join('/');
            } else if (d.data) { // Compatibilidade com versões antigas
                dataF = d.data.split('-').reverse().join('/');
            }

            const val = parseFloat(d.valor) || 0;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataF}</td>
                <td><strong>${d.nome}</strong></td>
                <td>${d.descricao || ''}</td>
                <td style="color: red; font-weight: bold;">R$ ${val.toFixed(2)}</td>
                <td><button class="btn-action delete btn-pagar">Pagar</button></td>
            `;
            
            tr.querySelector('.btn-pagar').onclick = async () => {
                if(confirm(`Confirmar pagamento de R$ ${val.toFixed(2)}?`)) {
                    await deleteDoc(doc(db, "empresas", empresaId, "devedores", docSnap.id));
                    await logActivity('fas fa-check', 'green', 'Dívida Paga', `Recebido de ${d.nome}`);
                    carregarDevedores();
                }
            };
            tbody.appendChild(tr);
        });
    } catch (e) { console.error("Erro devedores:", e); }
}

/* ==================================================================
   5. OUTRAS FUNÇÕES (PRODUTOS, PERFIS, ETC)
   ================================================================== */
async function carregarPerfis() {
    const grid = document.getElementById('profile-grid');
    if(!grid) return;
    const empresaId = getEmpresaId();
    if(!empresaId) return;

    const snap = await getDocs(collection(db, "empresas", empresaId, "perfis"));
    grid.innerHTML = '';
    snap.forEach(d => {
        const p = d.data();
        const div = document.createElement('div');
        div.className = 'profile-card';
        div.innerHTML = `<img src="${p.foto_perfil || PLACEHOLDER_IMG}" class="profile-card-pic"><span>${p.nome}</span>`;
        div.onclick = () => {
            localStorage.setItem('currentProfile', p.nome);
            window.location.href = 'dashboard.html';
        };
        grid.appendChild(div);
    });
}

function setupAdicionarProduto() {
    const form = document.getElementById('form-add-product');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empresaId = getEmpresaId();
        const sku = document.getElementById('sku-produto').value;
        const prod = {
            sku: sku,
            nome: document.getElementById('nome-produto').value,
            categoria: document.getElementById('categoria-produto').value,
            custo: Number(document.getElementById('preco-custo').value),
            venda: Number(document.getElementById('preco-venda').value),
            qtd: Number(document.getElementById('qtd-inicial').value),
            estoqueMinimo: Number(document.getElementById('estoque-minimo').value),
            vencimento: document.getElementById('data-vencimento').value
        };
        try {
            await setDoc(doc(db, "empresas", empresaId, "produtos", sku), prod);
            alert("Produto Salvo!");
            window.location.href = 'produtos.html';
        } catch(e) { alert(e.message); }
    });
}

async function carregarProdutos() {
    const tbody = document.getElementById('product-table-body');
    if(!tbody) return;
    const empresaId = getEmpresaId();
    if(!empresaId) return;

    try {
        const snap = await getDocs(collection(db, "empresas", empresaId, "produtos"));
        tbody.innerHTML = '';
        cacheProdutos = [];
        
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhum produto.</td></tr>';
            return;
        }

        snap.forEach(d => {
            const p = d.data();
            cacheProdutos.push(p);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.sku}</td><td>${p.nome}</td><td>${p.categoria_nome || ''}</td>
                <td>${p.qtd}</td><td>R$ ${p.venda.toFixed(2)}</td>
                <td><button class="btn-action delete">Excluir</button></td>
            `;
            tr.querySelector('.delete').onclick = async () => {
                if(confirm("Excluir produto?")) {
                    await deleteDoc(doc(db, "empresas", empresaId, "produtos", p.sku));
                    carregarProdutos();
                }
            };
            tbody.appendChild(tr);
        });
    } catch(e) { console.error(e); }
}

async function carregarDashboard() {
    const empresaId = getEmpresaId();
    if(!empresaId) return;
    
    const prods = await getDocs(collection(db, "empresas", empresaId, "produtos"));
    const elProd = document.querySelector('.stat-icon.green + div strong');
    if(elProd) elProd.textContent = prods.size;

    const feed = document.getElementById('activity-feed-list');
    if(feed) {
        const q = query(collection(db, "empresas", empresaId, "atividades"), orderBy("timestamp", "desc"), limit(5));
        const snap = await getDocs(q);
        feed.innerHTML = '';
        snap.forEach(d => {
            const a = d.data();
            feed.innerHTML += `
                <li class="feed-item">
                    <div class="activity-icon ${a.color}"><i class="${a.icon}"></i></div>
                    <div class="activity-details"><strong>${a.perfil_nome}</strong> <span>${a.description}</span></div>
                    <span class="activity-time">${a.time_string}</span>
                </li>`;
        });
    }
}

async function carregarCategorias() {
    const empresaId = getEmpresaId();
    if(!empresaId) return;
    const snap = await getDocs(query(collection(db, "empresas", empresaId, "categorias"), orderBy("nome")));
    
    const selects = document.querySelectorAll('#categoria-produto, #filtro-categoria');
    selects.forEach(sel => {
        if(sel) {
            const first = sel.options[0];
            sel.innerHTML = '';
            sel.appendChild(first);
            snap.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.data().nome;
                opt.textContent = d.data().nome;
                sel.appendChild(opt);
            });
        }
    });

    const list = document.querySelector('.category-list');
    if(list) {
        list.innerHTML = '';
        snap.forEach(d => {
            list.innerHTML += `<li class="profile-item"><span>${d.data().nome}</span></li>`;
        });
    }
}

function setupCategorias() {
    const form = document.getElementById('form-add-categoria');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-categoria').value;
        const empresaId = getEmpresaId();
        await addDoc(collection(db, "empresas", empresaId, "categorias"), { nome });
        alert("Categoria salva!");
        document.getElementById('nome-categoria').value = '';
        carregarCategorias();
    });
}

async function carregarGerenciarPerfis() {
    const uid = auth.currentUser.uid;
    const lista = document.getElementById('profile-list');
    const atualizar = async () => {
        const snap = await getDocs(collection(db, "empresas", uid, "perfis"));
        lista.innerHTML = '';
        snap.forEach(doc => {
            lista.innerHTML += `<li class="profile-item"><span>${doc.data().nome}</span></li>`;
        });
    };
    atualizar();

    document.getElementById('form-add-perfil').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-perfil').value;
        try {
            await setDoc(doc(db, "empresas", uid, "perfis", nome), { nome: nome, foto_perfil: PLACEHOLDER_IMG });
            alert("Perfil criado!");
            document.getElementById('nome-perfil').value = '';
            atualizar();
        } catch (e) { alert(e.message); }
    });
}

/* ==================================================================
   6. EXECUÇÃO PRINCIPAL (SISTEMA DE ROTAS)
   ================================================================== */

// Menu Mobile
const btnMenu = document.getElementById('btn-menu-mobile');
const sidebar = document.querySelector('.sidebar');
if (btnMenu && sidebar) {
    btnMenu.addEventListener('click', () => sidebar.classList.toggle('mobile-active'));
}

// Auth State - O Cérebro do App
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const publicas = ['index.html', 'cadastro.html'];

    if (user) {
        localStorage.setItem('empresaId', user.uid);
        const perfil = localStorage.getItem('currentProfile');

        if (!perfil && !['perfis.html', 'configuracoes.html'].includes(currentPage)) {
            window.location.href = 'perfis.html';
            return;
        }
        if (publicas.includes(currentPage)) {
            window.location.href = perfil ? 'dashboard.html' : 'perfis.html';
            return;
        }

        // --- INICIALIZA A PÁGINA (CHAMANDO AS FUNÇÕES QUE AGORA EXISTEM) ---
        if(document.querySelector('.top-header')) {
            carregarHeaderUsuario();
            setupGlobalSearch();
            carregarDropdownPerfis();
            setupLogout(); // <--- AGORA ESTA FUNÇÃO EXISTE!
        }
        
        carregarCategorias(); 
        
        if (document.getElementById('profile-grid')) carregarPerfis();
        if (document.getElementById('product-table-body')) carregarProdutos();
        if (document.getElementById('form-add-product')) setupAdicionarProduto();
        if (document.querySelector('.stats-grid')) carregarDashboard();
        
        if (document.getElementById('form-add-devedor')) setupDevedores();
        if (document.getElementById('lista-devedores-body')) carregarDevedores();
        
        if (document.getElementById('form-add-categoria')) setupCategorias();
        if (document.getElementById('form-add-perfil')) carregarGerenciarPerfis();

    } else {
        if (!publicas.includes(currentPage)) {
            window.location.href = 'index.html';
        }
        
        if (document.getElementById('form-login')) {
            document.getElementById('form-login').addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await signInWithEmailAndPassword(auth, 
                        document.getElementById('email').value, 
                        document.getElementById('senha').value
                    );
                } catch(err) { alert("Erro login: " + err.message); }
            });
        }
        if (document.getElementById('form-cadastro')) {
            document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const senha = document.getElementById('senha').value;
                if (senha !== document.getElementById('confirma-senha').value) return alert("Senhas diferem");
                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, senha);
                    const uid = cred.user.uid;
                    const batch = writeBatch(db);
                    batch.set(doc(db, "empresas", uid), { emailAdmin: email, criadoEm: serverTimestamp() });
                    batch.set(doc(db, "empresas", uid, "perfis", "Admin"), { nome: "Admin", foto_perfil: PLACEHOLDER_IMG });
                    await batch.commit();
                    alert("Conta criada!");
                    window.location.href = 'index.html';
                } catch(err) { alert("Erro cadastro: " + err.message); }
            });
        }
    }
});