/* === auth-guard.js (A VERSÃO FIREBASE CORRETA) === */

// Inicializa o Firebase (precisamos disso aqui também)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const currentPage = window.location.pathname.split('/').pop();

auth.onAuthStateChanged(user => {
    if (user) {
        // --- USUÁRIO ESTÁ LOGADO ---
        // Se ele está logado, mas não selecionou um perfil...
        const currentProfile = localStorage.getItem('currentProfile');
        if (!currentProfile && currentPage !== 'perfis.html' && currentPage !== 'configuracoes.html') {
            // ...manda para a seleção de perfis.
            window.location.href = 'perfis.html';
        }
        
        // Se ele está logado e tenta ver o login...
        if (currentPage === 'index.html' || currentPage === 'cadastro.html' || currentPage === '') {
            // ...manda para o dashboard.
            window.location.href = 'dashboard.html';
        }
        
    } else {
        // --- USUÁRIO NÃO ESTÁ LOGADO ---
        // Se ele não está logado, expulsa para o login
        if (currentPage !== 'index.html' && currentPage !== 'cadastro.html' && currentPage !== '') {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'index.html';
        }
    }
});