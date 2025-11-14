/* === auth-guard.js (A VERSÃO FIREBASE v8 CORRETA) === */

// firebaseConfig é carregado do firebase-config.js
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const currentPage = window.location.pathname.split('/').pop();

auth.onAuthStateChanged(user => {
    const empresaId = localStorage.getItem('empresaId'); // (Usamos empresaId)

    if (user && empresaId) {
        // --- USUÁRIO ESTÁ LOGADO ---
        const currentProfile = localStorage.getItem('currentProfile');
        if (!currentProfile && currentPage !== 'perfis.html' && currentPage !== 'configuracoes.html') {
            window.location.href = 'perfis.html';
        }
        
        if (currentPage === 'index.html' || currentPage === 'cadastro.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        }
        
    } else {
        // --- USUÁRIO NÃO ESTÁ LOGADO ---
        if (currentPage !== 'index.html' && currentPage !== 'cadastro.html' && currentPage !== '') {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'index.html';
        }
    }
});