# Mercado BOM D+ - Sistema de Gestão de Estoque e PDV

O **Mercado BOM D+** é uma aplicação web completa para gestão de pequenos mercados, mercearias e comércios. O sistema oferece controlo de estoque, ponto de venda (PDV/Caixa), gestão de produtos, relatórios financeiros e perfis de utilizador, utilizando **Firebase** como backend para dados em tempo real.

## 📋 Funcionalidades

O sistema está dividido em módulos para facilitar a administração do negócio:

### 🛒 Ponto de Venda (PDV)
* **Frente de Caixa:** Interface ágil para registar vendas.
* **Busca Inteligente:** Adição de produtos por SKU ou Nome com sugestões automáticas.
* **Carrinho:** Gestão de itens, quantidades e preços em tempo real.
* **Pagamentos:** Suporte para registo de pagamentos em Dinheiro (com cálculo de troco), Cartão e Pix.
* **Controlo de Estoque:** Baixa automática no estoque ao finalizar a venda.

### 📦 Gestão de Estoque
* **Cadastro de Produtos:** Adição completa com preço de custo, venda, SKU, categoria, validade e estoque mínimo.
* **Entradas e Saídas:** Registo de reposição de mercadoria e baixa por perdas, validade ou ajustes.
* **Alertas:** Notificação visual e relatórios de produtos com estoque baixo.

### 📊 Relatórios e Dashboard
* **Dashboard Interativo:** Visão geral com total de produtos, vendas do dia, vendas do mês e alertas de estoque.
* **Relatórios Detalhados:**
    * Vendas Diárias (histórico financeiro).
    * Inventário (valor total do estoque em custo).
    * Perdas e Ajustes.

### ⚙️ Configurações e Administração
* **Múltiplos Perfis:** Criação e gestão de perfis de acesso (ex: Admin, Caixa, Estoquista).
* **Personalização:** Definição de dados da empresa (Nome, CNPJ) e parâmetros de estoque mínimo.
* **Segurança:** Autenticação via Firebase Auth (Email/Senha).

## 🚀 Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (Responsivo), JavaScript (ES6 Modules).
* **Backend (BaaS):** Google Firebase.
    * *Authentication:* Gestão de utilizadores.
    * *Firestore:* Base de dados NoSQL em tempo real.
    * *Storage:* Armazenamento de imagens (opcional na configuração).
    * *Hosting:* Hospedagem da aplicação web.

## 🛠️ Configuração e Instalação

1.  Clone este repositório.
2.  Certifique-se de ter um projeto criado no [Firebase Console](https://console.firebase.google.com/).
3.  Configure o ficheiro `docs/firebase-config.js` com as suas credenciais:
    ```javascript
    const firebaseConfig = {
      apiKey: "SUA_API_KEY",
      authDomain: "SEU_PROJETO.firebaseapp.com",
      projectId: "SEU_PROJETO",
      storageBucket: "SEU_PROJETO.firebasestorage.app",
      messagingSenderId: "SEU_SENDER_ID",
      appId: "SEU_APP_ID"
    };
    ```
4.  Habilite o **Authentication** (Email/Senha) e o **Firestore Database** no painel do Firebase.

## ✒️ Autor

**Vitor da Silva Lopes**

---

## 📄 Licença

Este projeto é protegido por direitos de autor. O uso do código-fonte é restrito.
Consulte o ficheiro `LICENSE` para mais detalhes legais.