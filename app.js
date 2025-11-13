/* === app.js (A NOVA VERSÃO FIREBASE) === */

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

                // Cria um "canvas" (desenho) invisível
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Desenha a imagem grande no canvas pequeno
                ctx.drawImage(img, 0, 0, width, height);

                // Converte o canvas pequeno para um texto Base64
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
            img.src = event.target.result; // Carrega a imagem
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file); // Lê o arquivo
    });
}


/* * =====================================
 * INICIALIZAÇÃO DO FIREBASE
 * =====================================
 */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();       // Nosso novo "Login"
const db = firebase.firestore();    // Nosso novo "Banco de Dados"
// const storage = firebase.storage(); // NÃO PRECISAMOS MAIS DISSO


/* * =====================================
 * CARREGAR DADOS GLOBAIS (FOTO E NOME)
 * =====================================
 */
async function carregarDadosGlobaisUsuario() {
    const headerProfileName = document.getElementById('header-profile-name');
    const headerProfilePic = document.getElementById('header-profile-pic');
    
    const currentProfileName = localStorage.getItem('currentProfile');
    
    if (currentProfileName && headerProfileName) {
        headerProfileName.textContent = currentProfileName;
    }

    // Carrega a foto do perfil salvo
    try {
        const snapshot = await db.collection('perfis').get();
        const perfis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const perfilAtivo = perfis.find(p => p.nome === currentProfileName);

        if (headerProfilePic) {
            if (perfilAtivo && perfilAtivo.foto_perfil) {
                headerProfilePic.src = perfilAtivo.foto_perfil;
            } else {
                headerProfilePic.src = 'https://via.placeholder.com/40'; // Foto padrão
            }
        }
        
        // --- Carrega o Dropdown de Perfis ---
        const profileDropdownList = document.getElementById('profile-dropdown-list');
        if (profileDropdownList) {
            profileDropdownList.innerHTML = ''; // Limpa o dropdown
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
// Roda em todas as páginas, exceto login e perfis (que não têm header)
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
        if (!profileDropdown.contains(event.target)) {
            dropdownContent.style.display = 'none';
            profileDropdown.classList.remove('active');
        }
    });
}


// --- LÓGICA DA PÁGINA DE LOGIN ---
const loginForm = document.getElementById('form-login');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            await auth.signInWithEmailAndPassword(email, senha);
            localStorage.setItem('userToken', 'firebase-user'); 
            window.location.href = 'perfis.html';
        } catch (error) {
            console.error("Erro de login:", error.message);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                if (confirm('Usuário não encontrado. Deseja criar uma nova conta com este e-mail e senha?')) {
                    try {
                        await auth.createUserWithEmailAndPassword(email, senha);
                        alert('Conta criada! Faça o login agora.');
                    } catch (createError) {
                        alert('Erro ao criar conta: ' + createError.message);
                    }
                }
            } else if (error.code === 'auth/wrong-password') {
                alert('Senha incorreta.');
            } else {
                alert('Erro de login: 'indo para' + error.message);
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
                localStorage.removeItem('userToken'); 
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
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newActivity = { 
            icon, 
            color, 
            title, 
            description, 
            time_string: time, 
            perfil_nome: perfil,
            created_at: firebase.firestore.FieldValue.serverTimestamp() // Pega a data do servidor
        }; 

        await db.collection('atividades').add(newActivity);

    } catch (error) {
        console.error('Falha ao registrar atividade:', error.message);
    }
}


/* * =====================================
 * LÓGICA DO MODAL DE CONFIRMAÇÃO
 * =====================================
 */
// (O código do modal de exclusão continua o mesmo, ele não usa o storage)
// ... (Código do Modal) ...


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
            // Usa o SKU como ID do documento
            await db.collection('produtos').doc(novoProduto.sku).set(novoProduto);

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
    // ... (A função renderProductTable continua a mesma) ...
}

if (productTableBody) {
    async function carregarProdutos() {
        try {
            const snapshot = await db.collection('produtos').get();
            cacheProdutos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // (No Firestore, o ID é o SKU, então "id" e "sku" são a mesma coisa)
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
            await db.collection('categorias').add({ nome: categoryName });
            
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
            const snapshot = await db.collection('categorias').get();
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
            const snapshot = await db.collection('categorias').get();
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
// ... (Toda a lógica de Fechamento de Caixa, Dashboard e Relatórios
//     precisará ser "traduzida" para o Firestore,
//     vamos focar no Perfil primeiro) ...


/* * =====================================
 * LÓGICA DE AUTO-COMPLETAR (ENTRADA E SAÍDA)
 * =====================================
 */
// ... (Toda a lógica de Auto-Completar, Entrada e Saída
//     precisará ser "traduzida" para o Firestore) ...


/* * =====================================
 * TAREFA 14: LÓGICA DE EDITAR PRODUTO
 * =====================================
 */
// ... (Toda a lógica de Editar Produto
//     precisará ser "traduzida" para o Firestore) ...


/* * =====================================
 * TAREFA 15: LÓGICA DE CONFIGURAÇÕES (ATUALIZADO)
 * =====================================
 */
// (Vamos focar apenas na lógica de GERENCIAR PERFIS por enquanto)

const profilePicInput = document.getElementById('profile-pic-input');
const profilePicRemoveBtn = document.getElementById('profile-pic-remove'); 
let fotoBase64 = null; // Guarda a foto (em texto) que o usuário selecionou

// (Lógica de carregar/salvar configs do admin/mercado foi removida por enquanto)


/* * =====================================
 * TAREFA 18: LÓGICA DE PERFIS (ATUALIZADO)
 * =====================================
 */
const profileGrid = document.getElementById('profile-grid');
if (profileGrid) {
    async function carregarPerfis() {
        try {
            const snapshot = await db.collection('perfis').get();
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
        const snapshot = await db.collection('perfis').get();
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

// Lógica para ADICIONAR novo perfil
if (formAddPerfil) {
    formAddPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = document.getElementById('nome-perfil');
        const nome = input.value;
        if (!nome) return;
        try {
            await db.collection('perfis').add({ 
                nome: nome,
                foto_perfil: PLACEHOLDER_IMG // Adiciona uma foto padrão
            });
            input.value = ''; 
            carregarGerenciarPerfis(); 
        } catch (e) {
            alert('Erro ao adicionar perfil.');
        }
    });
}

/* * =====================================
 * TAREFA 19: LÓGICA DE EDITAR PERFIL (ATUALIZADO)
 * =====================================
 */
const formEditPerfil = document.getElementById('form-edit-perfil');
if (formEditPerfil) {
    const urlParams = new URLSearchParams(window.location.search);
    const perfilId = urlParams.get('id');
    const preview = document.getElementById('profile-pic-preview');
    const nomeInput = document.getElementById('nome-perfil');

    // 1. Carrega os dados do perfil
    async function carregarPerfilParaEditar() {
        if (!perfilId) {
            alert('ID do perfil não fornecido.');
            window.location.href = 'configuracoes.html';
            return;
        }
        try {
            const doc = await db.collection('perfis').doc(perfilId).get();
            if (!doc.exists) throw new Error('Perfil não encontrado.');
            
            const perfil = doc.data();
            nomeInput.value = perfil.nome;
            preview.src = perfil.foto_perfil || PLACEHOLDER_IMG;
            fotoBase64 = preview.src; 

        } catch (e) {
            alert('Erro ao carregar perfil: ' + e.message);
        }
    }
    carregarPerfilParaEditar();

    // 2. Lógica para ler a nova foto (USA A FUNÇÃO DE REDIMENSIONAR)
    const fotoInput = document.getElementById('profile-pic-input');
    fotoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                // Redimensiona para 200x200, 80% qualidade
                const resizedBase64 = await resizeAndEncodeImage(file, 200, 200, 0.8);
                preview.src = resizedBase64; 
                fotoBase64 = resizedBase64; // Salva o texto da imagem redimensionada
            } catch (e) {
                alert('Erro ao processar imagem. Tente JPG ou PNG.');
                preview.src = fotoBase64 || PLACEHOLDER_IMG; // Volta para a foto antiga
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
            await db.collection('perfis').doc(perfilId).update({
                nome: nome,
                foto_perfil: fotoBase64 // Salva o texto Base64 (ou null)
            });
            
            await logActivity('fas fa-user-edit', 'blue', 'Perfil Editado', `O perfil "${nome}" foi atualizado.`);
            alert('Perfil salvo com sucesso!');
            window.location.href = 'configuracoes.html';

        } catch (e) {
            alert('Erro ao salvar o perfil: ' + e.message);
        }
    });
}