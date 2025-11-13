/* === auth-guard.js === */
/* (ATUALIZADO: Agora usa index.html) */

// Pega o nome do arquivo da página atual
const currentPage = window.location.pathname.split('/').pop();

// 1. Pega o "crachá" da CONTA
const isAuthenticated = localStorage.getItem('userToken');

// 2. Pega o "crachá" do PERFIL
const currentProfile = localStorage.getItem('currentProfile');

if (!isAuthenticated) {
    // REGRA 1: Se não tem login (token), EXPULSA para o index.
    // (A única exceção é a própria página de login/index)
    if (currentPage !== 'index.html' && currentPage !== '') { // ('' é para o caso de /)
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'index.html'; // MUDANÇA AQUI
    }
} else {
    // REGRA 2: Se ESTÁ logado, mas não selecionou um PERFIL...
    if (
        !currentProfile && 
        currentPage !== 'perfis.html' && 
        currentPage !== 'configuracoes.html'
    ) {
        // ...EXPULSA para a seleção de perfis.
        window.location.href = 'perfis.html';
    }

    // REGRA 3: Se ESTÁ logado E tem um perfil, mas tenta ver o login...
    if (currentPage === 'index.html' || currentPage === '') {
        // ...MANDA para o dashboard.
        window.location.href = 'dashboard.html';
    }
}