/* === auth-guard.js (VERSÃO FINAL CORRIGIDA) === */

// Importa as ferramentas do Firebase
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const currentPage = window.location.pathname.split('/').pop();
const paginasDeLogin = ['index.html', 'cadastro.html', '']; // '' é a raiz

// Esta função ESPERA o Firebase dizer se o usuário está logado ou não
onAuthStateChanged(auth, (user) => {
    
    // Pega os "crachás" locais
    const currentProfile = localStorage.getItem('currentProfile');

    if (user) {
        // --- USUÁRIO ESTÁ LOGADO (confirmado pelo Firebase) ---

        // Salva o ID da empresa, caso não o tenha (ex: recarregou a página)
        localStorage.setItem('empresaId', user.uid);

        // REGRA 2: Se está logado, mas não selecionou PERFIL...
        if (!currentProfile && currentPage !== 'perfis.html' && currentPage !== 'configuracoes.html') {
            // ...manda para a seleção de perfis.
            window.location.href = 'perfis.html';
        }

        // REGRA 3: Se está logado E tem um perfil (ou está na tela de perfis)
        // mas tenta ver a tela de login...
        if (paginasDeLogin.includes(currentPage) && currentProfile) {
            // ...manda para o dashboard.
            window.location.href = 'dashboard.html';
        }

    } else {
        // --- USUÁRIO NÃO ESTÁ LOGADO ---
        
        // REGRA 1: Se não está logado e não está na página de login/cadastro...
        if (!paginasDeLogin.includes(currentPage)) {
            // ...EXPULSA para o login.
            alert('Você precisa estar logado para acessar esta página.');
            localStorage.removeItem('empresaId'); // Limpa crachás antigos
            localStorage.removeItem('currentProfile');
            window.location.href = 'index.html';
        }
    }
});