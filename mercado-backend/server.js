// --- 1. Importar as ferramentas ---
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// --- 2. Configurar o App ---
const app = express();
app.use(cors());
app.use(express.json());

// --- 3. Configurar a Conexão com o Banco de Dados ---
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'SUA_SENHA_ROOT_AQUI', // <-- CONFIRME SE SUA SENHA ESTÁ AQUI
    database: 'mercado_db'
};

/* =========================================
   ROTAS DA API (Nossas "Estradas")
========================================= */

// Rota de Teste
app.get('/', (req, res) => {
    res.send('API do Mercado BOM D+ está funcionando!');
});

/* * =====================================
 * ROTAS DE PRODUTOS (NOVO)
 * =====================================
 */

// ROTA 1: BUSCAR TODOS OS PRODUTOS (GET)
app.get('/produtos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM produtos');
        await connection.end();
        
        // Envia a lista de produtos como JSON
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA 2: CRIAR UM NOVO PRODUTO (POST)
app.post('/produtos', async (req, res) => {
    try {
        // Pega os dados do front-end (do app.js)
        const { nome, sku, categoria, custo, venda, qtd, vencimento, estoqueMinimo } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        const sql = `
            INSERT INTO produtos (sku, nome, categoria_nome, custo, venda, qtd, vencimento, estoque_minimo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(sql, [sku, nome, categoria, custo, venda, qtd, vencimento || null, estoqueMinimo]);
        await connection.end();
        
        res.status(201).json({ message: 'Produto criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA 3: ATUALIZAR UM PRODUTO (PUT)
app.put('/produtos/:sku', async (req, res) => {
    try {
        const { sku } = req.params; // Pega o SKU da URL
        const { nome, categoria, custo, venda, qtd, vencimento, estoqueMinimo } = req.body;
        
        const connection = await mysql.createConnection(dbConfig);
        const sql = `
            UPDATE produtos 
            SET nome = ?, categoria_nome = ?, custo = ?, venda = ?, qtd = ?, vencimento = ?, estoque_minimo = ?
            WHERE sku = ?
        `;
        await connection.execute(sql, [nome, categoria, custo, venda, qtd, vencimento || null, estoqueMinimo, sku]);
        await connection.end();

        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA 4: DELETAR UM PRODUTO (DELETE)
app.delete('/produtos/:sku', async (req, res) => {
    try {
        const { sku } = req.params; // Pega o SKU da URL
        
        const connection = await mysql.createConnection(dbConfig);
        
        // --- IMPORTANTE: Precisamos deletar as PERDAS primeiro ---
        // (Por causa da "FOREIGN KEY" que criamos)
        await connection.execute('DELETE FROM perdas WHERE produto_sku = ?', [sku]);
        
        // Agora podemos deletar o produto
        await connection.execute('DELETE FROM produtos WHERE sku = ?', [sku]);
        await connection.end();

        res.json({ message: 'Produto deletado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/* =========================================
   INICIA O SERVIDOR
========================================= */
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});