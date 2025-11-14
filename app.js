/* === app.js (Login e Cadastro - Versão Web CDN) === */



// --- IMPORTS DO FIREBASE ---
// Importa o 'auth' e 'db' do nosso config local
import { auth, db } from './firebase-config.js'; 

// Importa as funções dos URLs COMPLETOS do Firebase
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import { 
    doc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// --- LÓGICA DE CADASTRO (form-cadastro) ---
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
const empresaDocRef = doc(db, "empresas", user.uid);
            await setDoc(empresaDocRef, {
                adminEmail: user.email,
                createdAt: new Date(),
                nomeMercado: "Meu Mercado" 
            });

            // (NOVO) Cria o perfil "Admin" padrão dentro da empresa
            // Usamos o caminho "empresas/{id_da_empresa}/perfis/admin"
            const perfilAdminRef = doc(db, "empresas", user.uid, "perfis", "admin");
            await setDoc(perfilAdminRef, {
                nome: "Admin",
                foto_perfil: "https://via.placeholder.com/100" // Uma foto padrão
            });

            alert(`Conta criada com sucesso para ${user.email}! Você será redirecionado para o login.`);

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


// --- LÓGICA DE LOGIN (form-login) ---
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
            localStorage.removeItem('userToken');

            window.location.href = 'perfis.html';

        } catch (error) {
            alert("Erro: Email ou senha incorretos.");
            console.error("Erro de login:", error.message);
        }
    });
}

// --- LÓGICA DA PÁGINA DE PERFIS (NOVO) ---
const profileGrid = document.getElementById('profile-grid');
if (profileGrid) {
    
    async function carregarPerfis() {
        // 1. Pega o ID da empresa que salvamos no login
        const empresaId = localStorage.getItem('empresaId');
        if (!empresaId) {
            alert("Erro: ID da empresa não encontrado. Fazendo logout.");
            window.location.href = 'index.html';
            return;
        }

        // 2. Define o caminho para a subcoleção "perfis"
        const perfisRef = collection(db, "empresas", empresaId, "perfis");
        
        try {
            // 3. Busca os documentos dentro de "perfis"
            const querySnapshot = await getDocs(perfisRef);
            
            profileGrid.innerHTML = ''; // Limpa a área
            
            if (querySnapshot.empty) {
                profileGrid.innerHTML = '<p>Nenhum perfil encontrado para esta empresa.</p>';
                // (Você pode adicionar um link para 'configuracoes.html' aqui)
            }

            // 4. Cria os cards para cada perfil
            querySnapshot.forEach((doc) => {
                const perfil = doc.data();
                
                const card = document.createElement('div');
                card.className = 'profile-card';
                card.innerHTML = `
                    <img src="${perfil.foto_perfil || 'https://via.placeholder.com/100'}" alt="${perfil.nome}" class="profile-card-pic" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
                    <span>${perfil.nome}</span>
                `;
                
                // 5. Adiciona o clique para "entrar" no dashboard
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

// --- LÓGICA DE LOGOUT (BOTÃO SAIR) ---
const logoutButton = document.querySelector('.sidebar-footer a');
if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        if (confirm('Você tem certeza que deseja sair?')) {
            // Limpa os "crachás" do localStorage
            localStorage.removeItem('empresaId'); 
            localStorage.removeItem('currentProfile'); 
            
            // Manda de volta para o login
            window.location.href = 'index.html';
        }
    });
}
// --- LÓGICA DE CARREGAR DADOS GLOBAIS (NOME/FOTO ADMIN) ---
async function carregarDadosGlobaisUsuario() {
    const headerProfileName = document.getElementById('header-profile-name');
    const headerProfilePic = document.getElementById('header-profile-pic');
    
    // 1. Pega os dados salvos no localStorage
    const empresaId = localStorage.getItem('empresaId');
    const currentProfileName = localStorage.getItem('currentProfile');

    if (!headerProfileName) return; // Se não está numa página com header, não faz nada

    if (currentProfileName) {
        headerProfileName.textContent = currentProfileName;
    } else {
        // Isso não deve acontecer se o auth-guard estiver certo
        headerProfileName.textContent = "Sem Perfil";
    }

    // 2. Busca a foto do perfil no Firestore
    if (empresaId && currentProfileName) {
        try {
            // O caminho agora é: "empresas" -> {empresaId} -> "perfis" -> {nomeDoPerfil}
            // ATENÇÃO: Se você permitir renomear perfis, teremos que mudar isso
            const perfilDocRef = doc(db, "empresas", empresaId, "perfis", currentProfileName);
            const docSnap = await getDoc(perfilDocRef); // Precisamos importar getDoc

            if (docSnap.exists()) {
                const perfilData = docSnap.data();
                if (headerProfilePic && perfilData.foto_perfil) {
                    headerProfilePic.src = perfilData.foto_perfil;
                }
            }
        } catch (error) {
            console.error("Erro ao buscar foto do perfil:", error);
            if (headerProfilePic) headerProfilePic.src = 'https://via.placeholder.com/40'; // Foto padrão
        }
    }
}

// 3. Precisamos importar o 'getDoc'
// Vá ao TOPO do app.js e adicione 'getDoc' na lista de imports do firestore
// ...
// import { 
//     doc,
//     setDoc,
//     collection,
//     getDocs
// } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
// ...
// Adicione 'getDoc' assim:
// import { 
//     doc,
//     setDoc,
//     collection,
//     getDocs,
//     getDoc  // <-- ADICIONE ESTE
// } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
// ...

// 4. Executa a função em todas as páginas
carregarDadosGlobaisUsuario();