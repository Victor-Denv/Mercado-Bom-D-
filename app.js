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
    setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
// --- FIM DOS IMPORTS ---


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