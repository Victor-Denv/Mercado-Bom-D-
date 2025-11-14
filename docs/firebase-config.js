// Importa as funções dos URLs COMPLETOS do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js"; // <-- ADICIONADO

// Sua configuração original (está correta)
const firebaseConfig = {
  apiKey: "AIzaSyDcFP57aFI_qcnFEHznI_Ux1yNqiyYF1I0",
  authDomain: "mercado-bom-d.firebaseapp.com",
  projectId: "mercado-bom-d",
  storageBucket: "mercado-bom-d.firebasestorage.app", // <-- IMPORTANTE que isso esteja correto
  messagingSenderId: "728060272298",
  appId: "1:728060272298:web:775a3cff88a195a9217ad3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// --- Nossas exportações "finais" ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- ADICIONADO