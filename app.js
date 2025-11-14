/* === app.js (A NOVA VERSÃO FIREBASE - COMPLETA) === */

// Define o nome da chave de Configurações
const CONFIG_KEY = 'marketConfig'; 
const PLACEHOLDER_IMG = 'https://via.placeholder.com/100';

/* * =====================================
 * NOVA FUNÇÃO MÁGICA: REDIMENSIONAR IMAGEM
 * (Isso converte a foto em texto para salvar no Firestore)
 * =====================================
 */
function resizeAndEncodeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calcula o redimensionamento
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
 * INICIALIZAÇÃO DO FIREBASE
 * =====================================
 */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();       // Nosso novo "Login"
const db = firebase.firestore();    // Nosso novo "Banco de Dados"


/* * =====================================
 * CARREGAR DADOS GLOBAIS (FOTO E NOME)
 * =====================================
 */
async function carregarDadosGlobaisUsuario() {
    const headerProfileName = document.getElementById('header-profile-name');
    const headerProfilePic = document.getElementById('header-profile-pic');
    
    const currentProfileName = localStorage.getItem('currentProfile');
    const empresaId = localStorage.getItem('empresaId');

    if (!empresaId) return; // Não faz nada se não souber a empresa
    
    if (currentProfileName && headerProfileName) {
        headerProfileName.textContent = currentProfileName;
    }

    try {
        const snapshot = await db.collection('empresas').doc(empresaId).collection('perfis').get();
        const perfis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const perfilAtivo = perfis.find(p => p.nome === currentProfileName);

        if (headerProfilePic) {
            if (perfilAtivo && perfilAtivo.foto_perfil) {
                headerProfilePic.src = perfilAtivo.foto_perfil;
            } else {
                headerProfilePic.src = 'https://via.placeholder.com/40'; // Foto padrão
            }
        }
        
        const profileDropdownList = document.getElementById('profile-dropdown-list');
        if (profileDropdownList) {
            profileDropdownList.innerHTML = ''; 
            perfis.forEach(perfil => {
                const link = document.createElement('a');
                link.href = "#";
                link.innerHTML = `
                    <img src="${perfil.foto_perfil || 'https://via.placeholder.com/30'}" alt="${perfil.nome}" class="dropdown-avatar">
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

            const switchLink = document.createElement('a');
            switchLink.href = "perfis.html";
            switchLink.className = "add-profile-link";
            switchLink.innerHTML = `<i class="fas fa-users"></i> Trocar de Perfil`;
            profileDropdownList.appendChild(switchLink);
        }

    } catch (error) {
        console.error('Erro ao carregar dados de perfis:', error);
        if (headerProfilePic) headerProfilePic.src = 'https://via.placeholder.com/40';
    }
}
// Roda em todas as páginas, exceto login, cadastro e perfis
if (document.getElementById('header-profile-pic')) {
    carregarDadosGlobaisUsuario();
}


/* * =====================================
 * LÓGICA DO DROPDOWN DE PERFIL
 * =====================================
 */
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
        if (profileDropdown && !profileDropdown.contains(event.target)) {
            dropdownContent.style.display = 'none';
            profileDropdown.classList.remove('active');
        }
    });
}

// --- LÓGICA DE CRIAR CONTA (cadastro.html) ---
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
            const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
            const user = userCredential.user;

            // Cria o "documento" da empresa no Firestore
            const empresaDocRef = db.collection("empresas").doc(user.uid);
            await empresaDocRef.set({
                adminEmail: user.email,
                createdAt: new Date(),
                nomeMercado: "Meu Mercado" 
            });

            // Cria o perfil "Admin" padrão dentro da empresa
            const perfilAdminRef = db.collection("empresas").doc(user.uid).collection("perfis").doc(); // ID automático
            await perfilAdminRef.set({
                nome: "Admin",
                foto_perfil: PLACEHOLDER_IMG
            });

            alert(`Conta criada com sucesso para ${user.email}! Você será redirecionado para o login.`);
            window.location.href = 'index.html';

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                alert("Erro: Este email já está em uso.");
            } else if (error.code === 'auth/weak-password') {
                alert("Erro: A senha é muito fraca. (Mínimo 6 caracteres)");
            } else {
                alert("Erro ao criar conta: " + error.message);
                console.error("Erro de cadastro:", error);
            }
        }
    });
}

// --- LÓGICA DE LOGIN (index.html) ---
const loginForm = document.getElementById('form-login');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, senha);
            const user = userCredential.user;

            // Salva o ID da CONTA (empresa)
            localStorage.setItem('empresaId', user.uid); 
            localStorage.removeItem('userToken'); // Remove o token antigo
            window.location.href = 'perfis.html';

        } catch (error) {
            console.error("Erro de login:", error.message);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email' || error.code === 'auth/invalid-credential') {
                alert('Erro: Usuário não encontrado.');
            } else if (error.code === 'auth/wrong-password') {
                alert('Senha incorreta.');
            } else {
                alert('Erro de login: ' + error.message);
            }
        }
    });
}

// --- LÓGICA DE LOGOUT (BOTÃO SAIR) ---
const logoutButton = document.querySelector('.sidebar-footer a');
if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        if (confirm('Você tem certeza que deseja sair?')) {
            auth.signOut().then(() => {
                localStorage.removeItem('empresaId'); 
                localStorage.removeItem('currentProfile'); 
                localStorage.removeItem(CONFIG_KEY); 
                window.location.href = 'index.html';
            });
        }
    });
}

/* * =====================================
 * LÓGICA DE REGISTRO DE ATIVIDADES
 * =====================================
 */
async function logActivity(icon, color, title, description) {
    try {
        const perfil = localStorage.getItem('currentProfile') || 'Sistema'; 
        const empresaId = localStorage.getItem('empresaId');
        if (!empresaId) return;

        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newActivity = { 
            icon, 
            color, 
            title, 
            description, 
            time_string: time, 
            perfil_nome: perfil,
            created_at: firebase.firestore.FieldValue.serverTimestamp() 
        }; 

        await db.collection('empresas').doc(empresaId).collection('atividades').add(newActivity);

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
        modalOverlay.removeAttribute('data-profile-id'); 
    }
}

if (modalOverlay) {
    modalBtnCancel.addEventListener('click', closeModal);
    modalCloseIcon.addEventListener('click', closeModal);

    modalBtnConfirm.addEventListener('click', async () => {
        const skuParaDeletar = modalOverlay.dataset.sku;
        const idParaDeletar = modalOverlay.dataset.id; 
        const profileIdParaDeletar = modalOverlay.dataset.profileId;
        const empresaId = localStorage.getItem('empresaId');

        if (!empresaId) {
            alert('Erro: ID da empresa não encontrado. Faça login novamente.');
            return;
        }

        if (skuParaDeletar) { // Deletar Produto
            try {
                const docRef = db.collection('empresas').doc(empresaId).collection('produtos').doc(skuParaDeletar);
                const produtoDoc = await docRef.get();
                const produtoDeletado = produtoDoc.data();

                await docRef.delete();
                
                if(produtoDeletado) {
                    await logActivity('fas fa-trash-alt', 'red', 'Produto Excluído', `O produto "${produtoDeletado.nome}" foi removido.`);
                }
                alert('Produto excluído com sucesso!');
                window.location.reload(); 
            } catch (error) {
                alert(`Erro ao deletar produto: ${error.message}`);
            }

        } 
        else if (idParaDeletar) { // Deletar Categoria
            try {
                const docRef = db.collection('empresas').doc(empresaId).collection('categorias').doc(idParaDeletar);
                const catDoc = await docRef.get();
                const categoriaDeletada = catDoc.data();

                await docRef.delete();
                
                if (categoriaDeletada) {
                    await logActivity('fas fa-trash-alt', 'red', 'Categoria Excluída', `A categoria "${categoriaDeletada.nome}" foi removida.`);
                }
                alert('Categoria excluída com sucesso!');
                window.location.reload(); 
            } catch (error) {
                alert(`Erro ao deletar categoria: ${error.message}`);
            }
        }
        else if (profileIdParaDeletar) { // Deletar Perfil
            try {
                const docRef = db.collection('empresas').doc(empresaId).collection('perfis').doc(profileIdParaDeletar);
                const perfilDoc = await docRef.get();
                const perfilDeletado = perfilDoc.data();

                if (perfilDeletado && (perfilDeletado.nome === 'Admin' || perfilDeletado.nome === 'Vitor')) {
                    alert('Não é possível excluir perfis principais.');
                    closeModal();
                    return;
                }

                await docRef.delete();

                if (perfilDeletado) {
                    await logActivity('fas fa-user-minus', 'red', 'Perfil Excluído', `O perfil "${perfilDeletado.nome}" foi removido.`);
                }
                alert('Perfil excluído com sucesso!');
                carregarGerenciarPerfis(); 
                closeModal();
                if (localStorage.getItem('currentProfile') === perfilDeletado.nome) {
                    localStorage.removeItem('currentProfile');
                    window.location.href = 'perfis.html';
                }
            } catch (error) {
                alert(`Erro ao deletar perfil: ${error.message}`);
            }
        }
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
        
        const empresaId = localStorage.getItem('empresaId');
        const sku = document.getElementById('sku-produto').value;
        if (!sku) {
            alert('Erro: O Código (SKU) é obrigatório!');
            return;
        }

        const novoProduto = {
            nome: document.getElementById('nome-produto').value,
            sku: sku,
            categoria: document.getElementById('categoria-produto').value,
            custo: parseFloat(document.getElementById('preco-custo').value) || 0,
            venda: parseFloat(document.getElementById('preco-venda').value) || 0,
            qtd: parseInt(document.getElementById('qtd-inicial').value) || 0,
            vencimento: document.getElementById('data-vencimento').value || null,
            estoqueMinimo: parseInt(document.getElementById('estoque-minimo').value) || 10
        };

        try {
            await db.collection('empresas').doc(empresaId).collection('produtos').doc(novoProduto.sku).set(novoProduto);

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
                <td>${produto.categoria}</td> 
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
            const empresaId = localStorage.getItem('empresaId');
            if (!empresaId) throw new Error("Empresa não logada.");

            const snapshot = await db.collection('empresas').doc(empresaId).collection('produtos').get();
            cacheProdutos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const empresaId = localStorage.getItem('empresaId');
        if (!categoryName) {
            alert('Por favor, digite o nome da categoria.');
            return;
        }
        try {
            await db.collection('empresas').doc(empresaId).collection('categorias').add({ nome: categoryName });
            
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('categorias').orderBy('nome').get();
            const categorias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('categorias').orderBy('nome').get();
            const categorias = snapshot.docs.map(doc => doc.data());
            
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
        const data = dataField.value;
        const empresaId = localStorage.getItem('empresaId');
        const fechamento = {
            dinheiro: parseFloat(document.getElementById('total-dinheiro').value) || 0,
            cartao: parseFloat(document.getElementById('total-cartao').value) || 0,
            pix: parseFloat(document.getElementById('total-pix').value) || 0,
            data: data,
            mes: dataObj.getMonth() + 1,
            ano: dataObj.getFullYear()
        };
        fechamento.total = fechamento.dinheiro + fechamento.cartao + fechamento.pix;

        try {
            const docRef = db.collection('empresas').doc(empresaId).collection('fechamentos').doc(data);
            const doc = await docRef.get();
            
            if (doc.exists) {
                alert('Erro: O caixa já foi fechado hoje!');
                return;
            }
            
            await docRef.set(fechamento);
            
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
        const empresaId = localStorage.getItem('empresaId');
        if (!empresaId) return;

        try {
            // 1. Carrega os números dos cards
            
            const prodSnapshot = await db.collection('empresas').doc(empresaId).collection('produtos').get();
            const totalProdutos = prodSnapshot.size;

            const dataObj = new Date();
            const dataHoje = dataObj.toLocaleDateString('pt-BR');
            const mesAtual = dataObj.getMonth() + 1;
            const anoAtual = dataObj.getFullYear();
            
            const docDia = await db.collection('empresas').doc(empresaId).collection('fechamentos').doc(dataHoje).get();
            const vendasDoDia = docDia.exists ? docDia.data().total : 0;
            
            const mesSnapshot = await db.collection('empresas').doc(empresaId).collection('fechamentos')
                                        .where('mes', '==', mesAtual)
                                        .where('ano', '==', anoAtual)
                                        .get();
            const vendasDoMes = mesSnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);

            const produtos = prodSnapshot.docs.map(doc => doc.data());
            const totalEstoqueBaixo = produtos.filter(p => (p.qtd || 0) <= (p.estoqueMinimo || 10)).length;


            // Preenche os cards
            const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
            const vendasDiaCard = statsGrid.querySelector('.stat-icon.yellow').nextElementSibling.querySelector('strong');
            const valorVendasMesCard = statsGrid.querySelector('.stat-icon.blue').nextElementSibling.querySelector('strong');
            const estoqueMinimoCard = statsGrid.querySelector('.stat-icon.red').nextElementSibling.querySelector('strong');

            if (totalProdutosCard) totalProdutosCard.textContent = totalProdutos;
            if (vendasDiaCard) vendasDiaCard.textContent = `R$ ${vendasDoDia.toFixed(2)}`;
            if (valorVendasMesCard) valorVendasMesCard.textContent = `R$ ${vendasDoMes.toFixed(2)}`;
            if (estoqueMinimoCard) estoqueMinimoCard.textContent = totalEstoqueBaixo;

        } catch (error) {
            console.error("Erro no Dashboard:", error.message);
            const totalProdutosCard = statsGrid.querySelector('.stat-icon.green').nextElementSibling.querySelector('strong');
            if (totalProdutosCard) totalProdutosCard.textContent = "Erro!";
        }

        // 2. Carrega o Extrato de Atividades
        const activityFeedList = document.getElementById('activity-feed-list');
        if (activityFeedList) {
            try {
                const snapshot = await db.collection('empresas').doc(empresaId).collection('atividades').orderBy('created_at', 'desc').limit(10).get();
                const activities = snapshot.docs.map(doc => doc.data());
                
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('fechamentos').orderBy('ano', 'desc').orderBy('mes', 'desc').get();
            const fechamentos = snapshot.docs.map(doc => doc.data());
            
            salesReportBody.innerHTML = '';
            if (fechamentos.length > 0) {
                fechamentos.forEach(fechamento => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fechamento.data}</strong></td>
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('produtos').get();
            const produtos = snapshot.docs.map(doc => doc.data());
            const itens = produtos.filter(p => (p.qtd || 0) <= (p.estoqueMinimo || 10));
            
            stockLowReportBody.innerHTML = '';
            if (itens.length > 0) {
                itens.forEach(produto => {
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('produtos').get();
            const itens = snapshot.docs.map(doc => doc.data());

            inventoryReportBody.innerHTML = '';
            let grandTotal = 0;
            if (itens.length > 0) {
                itens.forEach(produto => {
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('perdas').orderBy('created_at', 'desc').get();
            const perdas = snapshot.docs.map(doc => doc.data());
            
            lossesReportBody.innerHTML = '';
            let totalPerdas = 0;
            if (perdas.length > 0) {
                perdas.forEach(perda => {
                    const custoPerda = parseFloat(perda.custo_total) || 0;
                    totalPerdas += custoPerda;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${perda.data}</td>
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
                const empresaId = localStorage.getItem('empresaId');
                const snapshot = await db.collection('empresas').doc(empresaId).collection('produtos').get();
                cacheProdutosAutocomplete = snapshot.docs.map(doc => doc.data());
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
 * TAREFA 7: LÓGICA DE SALVAR ENTRADA
 * =====================================
 */
const formEntrada = document.getElementById('form-add-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', async (event) => {
        event.preventDefault();
        const skuParaAtualizar = skuSelecionadoInput.value;
        const quantidadeParaAdicionar = parseInt(document.getElementById('quantidade').value) || 0;
        const empresaId = localStorage.getItem('empresaId');
        if (!skuParaAtualizar || quantidadeParaAdicionar <= 0) {
            alert('Erro: Você deve selecionar um produto da lista e inserir uma quantidade válida.');
            return;
        }
        try {
            const docRef = db.collection('empresas').doc(empresaId).collection('produtos').doc(skuParaAtualizar);
            
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) throw new Error("Produto não existe!");
                const qtdAntiga = doc.data().qtd || 0;
                const novaQtd = qtdAntiga + quantidadeParaAdicionar;
                transaction.update(docRef, { qtd: novaQtd });
            });
            
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
        const empresaId = localStorage.getItem('empresaId');

        if (!skuParaAtualizar || quantidadeParaRemover <= 0) {
            alert('Erro: Você deve selecionar um produto da lista e inserir uma quantidade válida.');
            return;
        }

        try {
            const docRef = db.collection('empresas').doc(empresaId).collection('produtos').doc(skuParaAtualizar);
            let produto;

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) throw new Error("Produto não existe!");
                
                produto = doc.data();
                const qtdAntiga = parseInt(produto.qtd) || 0;
                
                if (quantidadeParaRemover > qtdAntiga) {
                    throw new Error(`Você não pode remover ${quantidadeParaRemover} unidades. O estoque atual é de apenas ${qtdAntiga}.`);
                }
                
                const novaQtd = qtdAntiga - quantidadeParaRemover;
                transaction.update(docRef, { qtd: novaQtd });
            });

            // Se a transação deu certo, registra a perda
            const custoTotal = (parseFloat(produto.custo) || 0) * quantidadeParaRemover;
            await db.collection('empresas').doc(empresaId).collection('perdas').add({
                data: new Date().toLocaleDateString('pt-BR'),
                nome_produto: produto.nome,
                produto_sku: skuParaAtualizar,
                qtd: quantidadeParaRemover,
                motivo: motivo,
                custo_total: custoTotal,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
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
                const empresaId = localStorage.getItem('empresaId');
                const doc = await db.collection('empresas').doc(empresaId).collection('produtos').doc(skuParaEditar).get();
                if (!doc.exists) throw new Error('Produto não encontrado.');
                
                const produtoParaEditar = doc.data();
                
                document.getElementById('nome-produto').value = produtoParaEditar.nome;
                document.getElementById('sku-produto').value = produtoParaEditar.sku;
                document.getElementById('categoria-produto').value = produtoParaEditar.categoria; 
                document.getElementById('preco-custo').value = produtoParaEditar.custo;
                document.getElementById('preco-venda').value = produtoParaEditar.venda;
                document.getElementById('qtd-inicial').value = produtoParaEditar.qtd;
                document.getElementById('data-vencimento').value = produtoParaEditar.vencimento || '';
                document.getElementById('estoque-minimo').value = produtoParaEditar.estoqueMinimo;

            } catch (error) {
                alert('Erro ao carregar dados do produto: ' + error.message);
                window.location.href = 'produtos.html';
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
            const empresaId = localStorage.getItem('empresaId');
            await db.collection('empresas').doc(empresaId).collection('produtos').doc(skuAtualizado).update(produtoAtualizado);
            
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
            const empresaId = localStorage.getItem('empresaId');
            const doc = await db.collection('empresas').doc(empresaId).get();
            const config = doc.exists ? doc.data() : {};
            
            document.getElementById('nome-completo').value = config.nomeAdmin || 'Admin';
            document.getElementById('email').value = config.adminEmail || auth.currentUser.email;
            if(config.profilePic) {
                document.getElementById('profile-pic-preview').src = config.profilePic;
            }
            document.getElementById('nome-mercado').value = config.nomeMercado || 'Mercado BOM D+';
            document.getElementById('cnpj').value = config.cnpj || '';
            document.getElementById('estoque-minimo').value = config.estoqueMinimoPadrao || 10;

        } catch(e) {
            alert('Erro ao carregar configurações.');
        }
    }
    carregarConfiguracoes();
}

const profilePicInput = document.getElementById('profile-pic-input');
const profilePicRemoveBtn = document.getElementById('profile-pic-remove'); 
// let fotoBase64 = null; // Removido, vamos ler direto do preview

if (profilePicInput) {
    profilePicInput.addEventListener('change', async function(event) {
        const file = event.target.files[0]; 
        const preview = document.getElementById('profile-pic-preview');
        if (!file || !preview) return;

        try {
            const resizedBase64 = await resizeAndEncodeImage(file, 200, 200, 0.8);
            preview.src = resizedBase64;
            
            if(formEditPerfil) { 
                fotoBase64 = resizedBase64;
            }
        } catch (e) {
            alert('Erro ao processar imagem. Tente JPG ou PNG.');
        }
    });
}
if(profilePicRemoveBtn) {
    profilePicRemoveBtn.addEventListener('click', () => {
        const preview = document.getElementById('profile-pic-preview');
        preview.src = PLACEHOLDER_IMG;
        profilePicInput.value = null; 
        
        if(formEditPerfil) { 
            fotoBase64 = null;
        }
    });
}

const formMeuPerfil = document.getElementById('form-meu-perfil');
if (formMeuPerfil) {
    formMeuPerfil.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const newSrc = document.getElementById('profile-pic-preview').src;
        const finalPic = newSrc.includes('placeholder.com') ? null : newSrc;
        const empresaId = localStorage.getItem('empresaId');

        const config = {
            nomeAdmin: document.getElementById('nome-completo').value,
            emailAdmin: document.getElementById('email').value, 
            profilePic: finalPic,
            nomeMercado: document.getElementById('nome-mercado').value,
            cnpj: document.getElementById('cnpj').value,
            estoqueMinimoPadrao: parseInt(document.getElementById('estoque-minimo').value) || 10
        };
        
        try {
            await db.collection('empresas').doc(empresaId).set(config, { merge: true });
            
            alert('Perfil salvo com sucesso!');
            localStorage.setItem(CONFIG_KEY, JSON.stringify({ profilePic: finalPic }));
            carregarDadosGlobaisUsuario(); 
        } catch(e) {
            alert('Erro ao salvar perfil.');
        }
    });
}
if (formConfigMercado) {
    formConfigMercado.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const newSrc = document.getElementById('profile-pic-preview').src;
        const finalPic = newSrc.includes('placeholder.com') ? null : newSrc;
        const empresaId = localStorage.getItem('empresaId');
        
        const config = {
            nomeMercado: document.getElementById('nome-mercado').value,
            cnpj: document.getElementById('cnpj').value,
            estoqueMinimoPadrao: parseInt(document.getElementById('estoque-minimo').value) || 10,
            nomeAdmin: document.getElementById('nome-completo').value,
            emailAdmin: document.getElementById('email').value,
            profilePic: finalPic
        };

        try {
            await db.collection('empresas').doc(empresaId).set(config, { merge: true });
            
            alert('Configurações do Mercado salvas com sucesso!');
        } catch(e) {
            alert('Erro ao salvar configurações.');
        }
    });
}
const formAlterarSenha = document.getElementById('form-alterar-senha');
if (formAlterarSenha) {
    formAlterarSenha.addEventListener('submit', async function(event) {
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

        try {
            const user = auth.currentUser;
            await user.updatePassword(novaSenha);
            alert('Senha alterada com sucesso!');
            document.getElementById('senha-atual').value = '';
            document.getElementById('nova-senha').value = '';
            document.getElementById('confirma-senha').value = '';
        } catch (error) {
            alert('Erro ao alterar senha: ' + error.message + '\n(Talvez você precise fazer login novamente para esta operação.)');
        }
    });
}
const btnLimparSistema = document.getElementById('btn-limpar-sistema');
if (btnLimparSistema) {
    btnLimparSistema.addEventListener('click', function() {
        if (confirm('ATENÇÃO: Você tem certeza que deseja limpar o sistema?')) {
            if (confirm('CONFIRMAÇÃO FINAL: Esta ação é irreversível e apagará TODOS os produtos, categorias e relatórios. Continuar?')) {
                // (Isso deve chamar uma função de back-end (Cloud Function) para ser seguro)
                alert('Função de Limpeza Total ainda não implementada com segurança. Limpando apenas o cache local...');
                localStorage.clear();
                window.location.href = 'index.html';
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
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('produtos').get();
            todosProdutos = snapshot.docs.map(doc => doc.data());
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
        const matchCategoria = (categoriaSelecionada === "") || (produto.categoria === categoriaSelecionada);
        return matchBusca && matchCategoria;
    });

    renderProductTable(produtosFiltrados);
}

if (filtroBuscaInput) {
    async function carregarFiltroCategorias() {
        try {
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('categorias').orderBy('nome').get();
            const categorias = snapshot.docs.map(doc => doc.data());
            
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
        if (globalSearchResults && !event.target.closest('.search-bar')) {
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
    async function carregarPerfis() {
        try {
            const empresaId = localStorage.getItem('empresaId');
            const snapshot = await db.collection('empresas').doc(empresaId).collection('perfis').get();
            const perfis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            profileGrid.innerHTML = ''; 
            perfis.forEach(perfil => {
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
    if (!profileList) return; 
    try {
        const empresaId = localStorage.getItem('empresaId');
        const snapshot = await db.collection('empresas').doc(empresaId).collection('perfis').get();
        const perfis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        profileList.innerHTML = '';
        perfis.forEach(perfil => {
            const li = document.createElement('li');
            li.className = 'profile-item'; 
            li.innerHTML = `
                <img src="${perfil.foto_perfil || 'https://via.placeholder.com/30'}" alt="${perfil.nome}" class="dropdown-avatar">
                <span>${perfil.nome}</span>
                <button class="btn-action edit" data-id="${perfil.id}"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-action delete" data-id="${perfil.id}"><i class="fas fa-trash-alt"></i></button>
            `;
            profileList.appendChild(li);

            // Ativa o botão de editar
            li.querySelector('.btn-action.edit').addEventListener('click', () => {
                window.location.href = `editar-perfil.html?id=${perfil.id}`;
            });
            // Ativa o botão de deletar
            li.querySelector('.btn-action.delete').addEventListener('click', () => {
                modalOverlay.dataset.profileId = perfil.id; 
                openModal();
            });
        });
    } catch (e) {
        profileList.innerHTML = '<li><span>Erro ao carregar.</span></li>';
    }
}
if(profileList) carregarGerenciarPerfis();

if (formAddPerfil) {
    formAddPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = document.getElementById('nome-perfil');
        const nome = input.value;
        const empresaId = localStorage.getItem('empresaId');
        if (!nome) return;
        try {
            await db.collection('empresas').doc(empresaId).collection('perfis').add({ 
                nome: nome,
                foto_perfil: PLACEHOLDER_IMG 
            });
            input.value = ''; 
            carregarGerenciarPerfis(); 
        } catch (e) {
            alert('Erro ao adicionar perfil.');
        }
    });
}

/* * =====================================
 * TAREFA 19: LÓGICA DE EDITAR PERFIL
 * =====================================
 */
const formEditPerfil = document.getElementById('form-edit-perfil');
if (formEditPerfil) {
    const urlParams = new URLSearchParams(window.location.search);
    const perfilId = urlParams.get('id');
    const preview = document.getElementById('profile-pic-preview');
    const nomeInput = document.getElementById('nome-perfil');
    let fotoBase64 = null; // Guarda o NOVO texto da imagem

    // 1. Carrega os dados do perfil
    async function carregarPerfilParaEditar() {
        if (!perfilId) {
            alert('ID do perfil não fornecido.');
            window.location.href = 'configuracoes.html';
            return;
        }
        try {
            const empresaId = localStorage.getItem('empresaId');
            const doc = await db.collection('empresas').doc(empresaId).collection('perfis').doc(perfilId).get();
            if (!doc.exists) throw new Error('Perfil não encontrado.');
            
            const perfil = doc.data();
            nomeInput.value = perfil.nome;
            preview.src = perfil.foto_perfil || PLACEHOLDER_IMG;
            // fotoBase64 = preview.src; // Não salva a foto antiga, espera uma nova

        } catch (e) {
            alert('Erro ao carregar perfil: ' + e.message);
        }
    }
    carregarPerfilParaEditar();

    // 2. Lógica para ler a nova foto
    const fotoInput = document.getElementById('profile-pic-input');
    fotoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                // Redimensiona para 200x200, 80% qualidade
                const resizedBase64 = await resizeAndEncodeImage(file, 200, 200, 0.8);
                preview.src = resizedBase64; 
                fotoBase64 = resizedBase64; // Salva o texto da NOVA imagem
            } catch (e) {
                alert('Erro ao processar imagem. Tente JPG ou PNG.');
                // preview.src = fotoBase64 || PLACEHOLDER_IMG; // Volta para a foto antiga
            }
        }
    });

    // 3. Lógica do botão Remover Foto
    const editRemoveBtn = document.getElementById('profile-pic-remove');
    if (editRemoveBtn) {
        editRemoveBtn.addEventListener('click', () => {
            preview.src = PLACEHOLDER_IMG;
            fotoBase64 = null; // Define a foto como nula
            fotoInput.value = null;
        });
    }

    // 4. Lógica para salvar
    formEditPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nome = nomeInput.value;
        if (!nome) {
            alert('O nome do perfil não pode ficar em branco.');
            return;
        }

        try {
            const empresaId = localStorage.getItem('empresaId');
            
            // Se a fotoBase64 não foi alterada (continua null), 
            // significa que o usuário não mexeu na foto.
            // Não queremos salvar a foto antiga de novo, apenas o nome.
            let dadosAtualizados = { nome: nome };
            if (fotoBase64 !== null) { // Se o usuário selecionou uma nova foto...
                dadosAtualizados.foto_perfil = fotoBase64;
            } else if (preview.src.includes('placeholder.com')) {
                // Se o usuário clicou em "Remover"
                dadosAtualizados.foto_perfil = null;
            }
            // Se o usuário não mexeu na foto, a 'foto_perfil' nem é enviada,
            // e o Firestore não mexe nela.

            await db.collection('empresas').doc(empresaId).collection('perfis').doc(perfilId).update(dadosAtualizados);
            
            await logActivity('fas fa-user-edit', 'blue', 'Perfil Editado', `O perfil "${nome}" foi atualizado.`);
            alert('Perfil salvo com sucesso!');
            window.location.href = 'configuracoes.html';

        } catch (e) {
            alert('Erro ao salvar o perfil: ' + e.message);
        }
    });
}