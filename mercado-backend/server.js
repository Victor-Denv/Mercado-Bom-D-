// --- 1. Importar as ferramentas ---
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// --- 2. Configurar o App ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta o limite para aceitar fotos de perfil

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
 * ROTA PARA O DASHBOARD
 * =====================================
 */
app.get('/dashboard-summary', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [produtoRows] = await connection.execute('SELECT COUNT(*) as totalProdutos FROM produtos');
        const totalProdutos = produtoRows[0].totalProdutos;

        const dataObj = new Date();
        const dataHoje = dataObj.toLocaleDateString('pt-BR'); 
        const mesAtual = dataObj.getMonth() + 1;
        const anoAtual = dataObj.getFullYear();

        const [diaRows] = await connection.execute('SELECT total FROM fechamentos WHERE data_fechamento = ?', [dataHoje]);
        const vendasDoDia = (diaRows.length > 0) ? diaRows[0].total : 0;
        
        const [mesRows] = await connection.execute(
            'SELECT SUM(total) as totalMes FROM fechamentos WHERE mes = ? AND ano = ?',
            [mesAtual, anoAtual]
        );
        const vendasDoMes = mesRows[0].totalMes || 0;

        const [estoqueRows] = await connection.execute(
            'SELECT COUNT(*) as totalEstoqueBaixo FROM produtos WHERE qtd <= estoque_minimo'
        );
        const totalEstoqueBaixo = estoqueRows[0].totalEstoqueBaixo;

        await connection.end();

        res.json({
            totalProdutos: totalProdutos,
            vendasDoDia: Number(vendasDoDia),
            vendasDoMes: Number(vendasDoMes),
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


/* * =====================================
 * ROTAS DE ESTOQUE
 * =====================================
 */
app.post('/estoque/entrada', async (req, res) => {
    try {
        const { sku, quantidade } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const sql = 'UPDATE produtos SET qtd = qtd + ? WHERE sku = ?';
        await connection.execute(sql, [quantidade, sku]);
        await connection.end();
        res.json({ message: 'Entrada registrada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/estoque/saida', async (req, res) => {
    try {
        const { sku, quantidade, motivo, nomeProduto, custoTotal } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        
        const updateSql = 'UPDATE produtos SET qtd = qtd - ? WHERE sku = ?';
        await connection.execute(updateSql, [quantidade, sku]);
        
        const insertSql = `
            INSERT INTO perdas (data_perda, produto_sku, nome_produto, qtd, motivo, custo_total)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const dataHoje = new Date().toLocaleDateString('pt-BR');
        await connection.execute(insertSql, [dataHoje, sku, nomeProduto, quantidade, motivo, custoTotal]);
        await connection.end();
        res.json({ message: 'Saída registrada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* * =====================================
 * ROTAS DE CATEGORIAS (NOVO)
 * =====================================
 */
app.get('/categorias', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM categorias');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/categorias', async (req, res) => {
    try {
        const { nome } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO categorias (nome) VALUES (?)', [nome]);
        await connection.end();
        res.status(201).json({ message: 'Categoria criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await mysql.createConnection(dbConfig);
        // (No futuro, você deve verificar se algum produto usa esta categoria antes de deletar)
        await connection.execute('DELETE FROM categorias WHERE id = ?', [id]);
        await connection.end();
        res.json({ message: 'Categoria deletada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* * =====================================
 * ROTAS DE FECHAMENTO DE CAIXA (NOVO)
 * =====================================
 */
app.get('/fechamentos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM fechamentos ORDER BY STR_TO_DATE(data_fechamento, "%d/%m/%Y") DESC');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/fechamentos', async (req, res) => {
    try {
        const { dinheiro, cartao, pix, total, data, mes, ano } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        
        // Verifica se já existe
        const [diaRows] = await connection.execute('SELECT * FROM fechamentos WHERE data_fechamento = ?', [data]);
        if (diaRows.length > 0) {
            return res.status(409).json({ error: 'O caixa já foi fechado hoje!' }); // 409 = Conflito
        }
        
        const sql = `
            INSERT INTO fechamentos (data_fechamento, dinheiro, cartao, pix, total, mes, ano)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(sql, [data, dinheiro, cartao, pix, total, mes, ano]);
        await connection.end();
        res.status(201).json({ message: 'Fechamento salvo com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* * =====================================
 * ROTAS DE RELATÓRIOS (NOVO)
 * =====================================
 */
app.get('/relatorios/estoque-baixo', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT sku, nome, categoria_nome, qtd, estoque_minimo FROM produtos WHERE qtd <= estoque_minimo');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/relatorios/inventario', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT nome, qtd, custo, (qtd * custo) as custo_total FROM produtos');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/relatorios/perdas', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM perdas ORDER BY STR_TO_DATE(data_perda, "%d/%m/%Y") DESC');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* * =====================================
 * ROTAS DE CONFIGURAÇÕES (NOVO)
 * =====================================
 */
app.get('/configuracoes', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Pega as configs do admin (usuário) e do mercado
        const [userRows] = await connection.execute('SELECT email, nome, foto_perfil FROM usuarios WHERE email = ?', ['admin@mercadobomd.com']); // (Email "chumbado" por enquanto)
        const [configRows] = await connection.execute('SELECT * FROM configuracoes WHERE id = 1');
        await connection.end();
        
        res.json({
            admin: userRows[0],
            mercado: configRows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/configuracoes', async (req, res) => {
    try {
        const { nomeAdmin, emailAdmin, profilePic, nomeMercado, cnpj, estoqueMinimoPadrao } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        
        // Salva perfil do admin
        await connection.execute('UPDATE usuarios SET nome = ?, foto_perfil = ? WHERE email = ?', [nomeAdmin, profilePic, emailAdmin]);
        
        // Salva configs do mercado (usamos INSERT... ON DUPLICATE KEY UPDATE para criar a linha 1 se ela não existir)
        const configSql = `
            INSERT INTO configuracoes (id, nome_mercado, cnpj, estoque_minimo_padrao)
            VALUES (1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            nome_mercado = ?, cnpj = ?, estoque_minimo_padrao = ?
        `;
        await connection.execute(configSql, [nomeMercado, cnpj, estoqueMinimoPadrao, nomeMercado, cnpj, estoqueMinimoPadrao]);
        
        await connection.end();
        res.json({ message: 'Configurações salvas com sucesso!' });
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