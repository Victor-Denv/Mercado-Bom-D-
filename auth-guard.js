/* === auth-guard.js === */
/* (ATUALIZADO: Com a correção do "loop") */

// Pega o nome do arquivo da página atual
const currentPage = window.location.pathname.split('/').pop();

// 1. Pega o "crachá" da CONTA
const isAuthenticated = localStorage.getItem('userToken');

// 2. Pega o "crachá" do PERFIL
const currentProfile = localStorage.getItem('currentProfile');

if (!isAuthenticated) {
    // REGRA 1: Se não tem login (token), EXPULSA para o login.
    if (currentPage !== 'login.html') {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
    }
} else {
    // REGRA 2: Se ESTÁ logado, mas não selecionou um PERFIL...
    if (
        !currentProfile && 
        currentPage !== 'perfis.html' && 
        currentPage !== 'configuracoes.html' // <-- AQUI ESTÁ A CORREÇÃO
    ) {
        // ...EXPULSA para a seleção de perfis.
        // (Ele agora PERMITE o acesso ao config.html)
        window.location.href = 'perfis.html';
    }

    // REGRA 3: Se ESTÁ logado E tem um perfil, mas tenta ver o login...
    if (currentPage === 'login.html') {
        // ...MANDA para o dashboard.
        window.location.href = 'dashboard.html';
    }
}