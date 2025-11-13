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
    password: 'vitor', // <-- CONFIRME SE SUA SENHA ESTÁ AQUI
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
 * ROTA PARA O DASHBOARD (A QUE FALTAVA)
 * =====================================
 */
app.get('/dashboard-summary', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1. Contar o total de produtos
        const [produtoRows] = await connection.execute('SELECT COUNT(*) as totalProdutos FROM produtos');
        const totalProdutos = produtoRows[0].totalProdutos;

        // 2. Pegar os dados de fechamento (para Vendas do Dia e Mês)
        const dataObj = new Date();
        const dataHoje = dataObj.toLocaleDateString('pt-BR'); // Ex: "12/11/2025"
        const mesAtual = dataObj.getMonth() + 1; // JS conta mês de 0-11, então somamos 1
        const anoAtual = dataObj.getFullYear();

        // Pega o fechamento de HOJE
        const [diaRows] = await connection.execute('SELECT total FROM fechamentos WHERE data_fechamento = ?', [dataHoje]);
        const vendasDoDia = (diaRows.length > 0) ? diaRows[0].total : 0;
        
        // Soma os totais do MÊS ATUAL
        const [mesRows] = await connection.execute(
            'SELECT SUM(total) as totalMes FROM fechamentos WHERE mes = ? AND ano = ?',
            [mesAtual, anoAtual]
        );
        const vendasDoMes = mesRows[0].totalMes || 0;

        // 3. Contar itens com estoque baixo
        const [estoqueRows] = await connection.execute(
            'SELECT COUNT(*) as totalEstoqueBaixo FROM produtos WHERE qtd <= estoque_minimo'
        );
        const totalEstoqueBaixo = estoqueRows[0].totalEstoqueBaixo;

        await connection.end();

        // 4. Envia todos os dados de uma vez
        res.json({
            totalProdutos: totalProdutos,
            vendasDoDia: Number(vendasDoDia), // Garante que é número
            vendasDoMes: Number(vendasDoMes), // Garante que é número
            totalEstoqueBaixo: totalEstoqueBaixo
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/* * =====================================
 * ROTAS DE PRODUTOS
 * =====================================
 */

// ROTA 1: BUSCAR TODOS OS PRODUTOS (GET)
app.get('/produtos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM produtos');
        await connection.end();
        
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA 2: CRIAR UM NOVO PRODUTO (POST)
app.post('/produtos', async (req, res) => {
    try {
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
        const { sku } = req.params;
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
        const { sku } = req.params;
        
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM perdas WHERE produto_sku = ?', [sku]);
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