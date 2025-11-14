/* === app.js (A NOVA VERSÃO FIREBASE - PARTE 1) === */

// Define o nome da chave de Configurações
const CONFIG_KEY = 'marketConfig'; 
const PLACEHOLDER_IMG = 'https://via.placeholder.com/100';

/* * =====================================
 * INICIALIZAÇÃO DO FIREBASE
 * =====================================
 */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();       // Nosso novo "Login"
const db = firebase.firestore();    // Nosso novo "Banco de Dados"
const storage = firebase.storage(); // Nosso "Armazém de Fotos"


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
            // O ID da empresa será o ID do usuário que a criou
            const empresaDocRef = db.collection("empresas").doc(user.uid);
            await empresaDocRef.set({
                adminEmail: user.email,
                createdAt: new Date(),
                nomeMercado: "Meu Mercado" 
            });

            // Cria o perfil "Admin" padrão dentro da subcoleção "perfis" da empresa
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

            // Salva o ID da CONTA (empresa) no localStorage
            localStorage.setItem('empresaId', user.uid); 
            localStorage.removeItem('userToken'); // Remove o token antigo
            
            // Manda para a seleção de perfis
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
 * LÓGICA DE PERFIS (perfis.html)
 * =====================================
 */
const profileGrid = document.getElementById('profile-grid');
if (profileGrid) {
    // 1. Carrega os perfis do Firestore
    async function carregarPerfis() {
        try {
            const empresaId = localStorage.getItem('empresaId');
            if (!empresaId) throw new Error("ID da Empresa não encontrado.");

            const snapshot = await db.collection('empresas').doc(empresaId).collection('perfis').get();
            const perfis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            profileGrid.innerHTML = ''; 
            if (perfis.length === 0) {
                 profileGrid.innerHTML = '<p style="color: white;">Nenhum perfil criado. Vá para "Gerenciar Perfis" para adicionar um.</p>';
            }

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
            profileGrid.innerHTML = `<p>Erro ao carregar perfis: ${e.message}</p>`;
        }
    }
    carregarPerfis();
}

// (O resto do seu app.js (produtos, categorias, etc.) FOI REMOVIDO)
// (Vamos adicioná-los de volta, um por um, depois que o login funcionar)