// firebase-config.js (Versão Correta para Módulos)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcFP57aFI_qcnFEHznI_Ux1yNqiyYF1I0",
  authDomain: "mercado-bom-d.firebaseapp.com",
  projectId: "mercado-bom-d",
  storageBucket: "mercado-bom-d.firebasestorage.app",
  messagingSenderId: "728060272298",
  appId: "1:728060272298:web:775a3cff88a195a9217ad3"
};

// Inicializa
const app = initializeApp(firebaseConfig);

// Exporta para os outros arquivos usarem
export const auth = getAuth(app);
export const db = getFirestore(app);