// Importa as funções que precisamos
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Para Autenticação
import { getFirestore } from "firebase/firestore"; // Para o Banco de Dados

// Sua configuração original (está correta)
const firebaseConfig = {
  apiKey: "AIzaSyDcFP57aFI_qcnFEHznI_Ux1yNqiyYF1I0",
  authDomain: "mercado-bom-d.firebaseapp.com",
  projectId: "mercado-bom-d",
  storageBucket: "mercado-bom-d.firebasestorage.app",
  messagingSenderId: "728060272298",
  appId: "1:728060272298:web:775a3cff88a195a9217ad3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// --- Nossas exportações "finais" ---

// Exporta o serviço de Autenticação para usarmos no app.js
export const auth = getAuth(app);

// Exporta o serviço do Firestore (banco de dados) para usarmos no app.js
export const db = getFirestore(app);