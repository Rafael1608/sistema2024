const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // JWT para autenticação de usuário
const Joi = require('joi'); // Validação de dados

const app = express();
const PORT = 3000;
const JWT_SECRET = 'seu_segredo_jwt_aqui'; // Defina uma chave secreta JWT

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../', 'frontend')));

// Conexão com banco de dados
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Root',
    database: 'mercado_db',
    connectionLimit: 10
});

// Teste de conexão ao banco
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
    connection.release();
});

// Validação com Joi
const schema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

// Rota de registro de usuário
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const { error } = schema.validate({ name, email, password });

    if (error) return res.status(400).json({ erro: error.details[0].message });

    try {
        const [results] = await pool.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (results.length > 0) {
            return res.status(400).json({ erro: "E-mail já cadastrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        await pool.promise().query(query, [name, email, hashedPassword]);

        return res.status(201).json({ sucesso: true, mensagem: "Usuário registrado com sucesso!" });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        return res.status(500).json({ erro: "Ocorreu um erro. Tente novamente mais tarde." });
    }
});

// Rota de login de usuário
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [results] = await pool.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (results.length === 0) return res.status(400).json({ erro: 'Credenciais inválidas' });

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.senha);
        if (!passwordMatch) return res.status(400).json({ erro: 'Credenciais inválidas' });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ sucesso: true, token });
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        return res.status(500).json({ erro: 'Ocorreu um erro. Tente novamente mais tarde.' });
    }
});

// CRUD de Mercado
app.post('/mercados', (req, res) => {
    const { nome, endereco } = req.body;

    if (!nome || !endereco) return res.status(400).json({ erro: 'Nome e endereço são obrigatórios.' });

    const query = 'INSERT INTO mercados (nome, endereco) VALUES (?, ?)';
    pool.query(query, [nome, endereco], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao cadastrar mercado.' });
        return res.status(201).json({ sucesso: true, id: resultado.insertId });
    });
});

app.get('/mercados', (req, res) => {
    const query = 'SELECT * FROM mercados';
    pool.query(query, (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao listar mercados.' });
        res.status(200).json(resultado);
    });
});

app.delete('/mercados/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM mercados WHERE id = ?';
    pool.query(query, [id], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao deletar mercado.' });
        if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Mercado não encontrado.' });
        res.status(204).send();
    });
});

app.get('/mercados/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT nome, endereco FROM mercados WHERE id = ?';
    pool.query(query, [id], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao buscar mercado pelo ID.' });
        if (resultado.length === 0) return res.status(404).json({ erro: 'Mercado não encontrado.' });
        res.status(200).json(resultado[0]);
    });
});

app.put('/mercados/:id', (req, res) => {
    const { id } = req.params;
    const { nome, endereco } = req.body;
    const query = 'UPDATE mercados SET nome = ?, endereco = ? WHERE id = ?';
    pool.query(query, [nome, endereco, id], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao atualizar mercado.' });
        if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Mercado não encontrado.' });
        res.status(200).json({ sucesso: true, mensagem: 'Mercado atualizado com sucesso.' });
    });
});

// CRUD de Produto em Mercado
app.post('/mercados/:id/produtos', (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, quantidade } = req.body;
    const query = 'INSERT INTO produtos (nome, descricao, preco, quantidade, mercado_id) VALUES (?, ?, ?, ?, ?)';

    pool.query(query, [nome, descricao, preco, quantidade, id], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
        res.status(201).json({ sucesso: true, id: resultados.insertId });
    });
});

app.get('/mercados/:id/produtos', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM produtos WHERE mercado_id = ?';
    pool.query(query, [id], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao listar produtos.' });
        res.status(200).json(resultados);
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
