/* === auth-guard.js (VERSÃO FINAL) === */

// Pega o nome do arquivo da página atual
const currentPage = window.location.pathname.split('/').pop();

// 1. Pega o "crachá" da CONTA (agora checando pelo 'empresaId')
const isAuthenticated = localStorage.getItem('empresaId');

// 2. Pega o "crachá" do PERFIL (continua igual)
const currentProfile = localStorage.getItem('currentProfile');

if (!isAuthenticated) {
    // REGRA 1: Se não tem login (empresaId), EXPULSA para o login.
    // (A única exceção é a própria página de login e a nova de cadastro)
    if (currentPage !== 'index.html' && currentPage !== 'cadastro.html' && currentPage !== '') {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'index.html';
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

    // REGRA 3: Se ESTÁ logado E tem um perfil, mas tenta ver o login/cadastro...
    if (currentPage === 'index.html' || currentPage === 'cadastro.html' || currentPage === '') {
        // ...MANDA para o dashboard.
        window.location.href = 'dashboard.html';
    }
}