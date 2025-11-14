/* === app.js (Login e Cadastro) === */

// --- IMPORTS DO FIREBASE ---
// Importa o 'auth' e 'db' que configuramos no firebase-config.js
import { auth, db } from './firebase-config.js'; 

// Importa as funções que vamos usar
import { 
    createUserWithEmailAndPassword, // Para criar contas
    signInWithEmailAndPassword    // Para fazer login
} from "firebase/auth";

import { 
    doc,    // Para referenciar um documento
    setDoc  // Para criar um documento
} from "firebase/firestore";
// --- FIM DOS IMPORTS ---


// --- LÓGICA DE CADASTRO (form-cadastro) ---
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmaSenha = document.getElementById('confirma-senha').value;

        // 1. Verifica se as senhas são iguais
        if (senha !== confirmaSenha) {
            alert("As senhas não conferem!");
            return; 
        }

        // 2. Tenta criar o usuário no Firebase Auth
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // 3. Cria a "Empresa" no Firestore
            // O ID do usuário (user.uid) será usado como ID do documento da empresa
            const empresaDocRef = doc(db, "empresas", user.uid);
            await setDoc(empresaDocRef, {
                adminEmail: user.email,
                createdAt: new Date(),
                nomeMercado: "Meu Mercado" // Um nome padrão
            });

            alert(`Conta criada com sucesso para ${user.email}! Você será redirecionado para o login.`);
            window.location.href = 'index.html'; // Manda para o login

        } catch (error) {
            // 4. Trata erros comuns
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
            // 1. Tenta fazer o login com o Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // 2. Guarda o ID da empresa no localStorage
            // Este é o "crachá" que o auth-guard.js vai procurar
            localStorage.setItem('empresaId', user.uid); 
            
            // Limpa tokens antigos (se houver)
            localStorage.removeItem('userToken');

            // 3. Redireciona para os perfis
            window.location.href = 'perfis.html';

        } catch (error) {
            // 4. Trata erros de login
            alert("Erro: Email ou senha incorretos.");
            console.error("Erro de login:", error.message);
        }
    });
}