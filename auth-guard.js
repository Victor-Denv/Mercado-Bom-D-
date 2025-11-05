/* === auth-guard.js === */
/* (Trocado para localStorage) */

// 1. Pegamos o "crachá" do localStorage
const isAuthenticated = localStorage.getItem('userToken'); // MUDANÇA AQUI

// 2. Verificamos se o crachá NÃO existe
if (!isAuthenticated) {
    // 3. Se não existe, o usuário é expulso para a tela de login
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'index.html';
}