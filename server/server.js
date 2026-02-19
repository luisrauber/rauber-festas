/* * ARQUIVO: server/server.js
 * CONFIGURADO PARA: Porta 3305 e Senha '1234'
 */
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt'); // <-- ADICIONADO PARA CRIPTOGRAFIA (Critério 3)

const app = express();
const PORT = 3000;

// Configurações básicas
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// APONTA PARA A PASTA CLIENT (IMPORTANTE)
// 1. Diz pro servidor: "Se alguém pedir '/uploads', procure na pasta '../client/uploads'"
app.use('/uploads', express.static(path.join(__dirname, '../client/uploads')));

// 2. Serve o resto do site normalmente
app.use(express.static(path.join(__dirname, '../client')));

// Configuração de Upload (Salva na pasta client/uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../client/uploads/')),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- CONEXÃO COM O BANCO (SEUS DADOS) ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',      // Sua senha
    database: 'rauber_db',
    port: 3305             // Sua porta do MySQL
});

db.connect((err) => {
    if (err) console.error('❌ Erro ao conectar no Banco:', err);
    else console.log('✅ Banco de Dados Conectado (Porta 3305)!');
});

// --- SIMULAÇÃO DE BANCO DE DADOS PARA O ADMIN (Critério 3) ---
// O bcrypt.hashSync gera a versão criptografada da senha "rauber123"
const EMAIL_ADMIN_SALVO = 'admin@rauber.com';
const HASH_SENHA_SALVA = bcrypt.hashSync('rauber123', 10);

// ================= ROTAS DO SISTEMA =================

// 1. Listar todas as reservas (Painel Admin)
app.get('/api/reservas', (req, res) => {
    db.query("SELECT * FROM reservas ORDER BY data_evento ASC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. Listar datas públicas (Site - main.js)
app.get('/api/reservas/publicas', (req, res) => {
    db.query("SELECT data_evento FROM reservas WHERE status_agendamento = 'ATIVO'", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. Criar Reserva
app.post('/api/reservas', (req, res) => {
    const { nome_cliente, data_evento, detalhes_evento, status_pagamento } = req.body;
    const query = "INSERT INTO reservas (nome_cliente, data_evento, detalhes_evento, status_pagamento, status_agendamento) VALUES (?, ?, ?, ?, 'ATIVO')";
    db.query(query, [nome_cliente, data_evento, detalhes_evento, status_pagamento], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Reserva criada!', id: result.insertId });
    });
});

// 4. ATUALIZAR RESERVA (CORRIGIDA PARA FINALIZAR)
app.put('/api/reservas/:id', (req, res) => {
    const { id } = req.params;
    const { nome_cliente, data_evento, detalhes_evento, status_pagamento } = req.body;
    
    // Se o site mandou APENAS "CONCLUIDO" (Botão Finalizar)
    if (!nome_cliente && status_pagamento === 'CONCLUIDO') {
        const query = "UPDATE reservas SET status_pagamento='CONCLUIDO', status_agendamento='CONCLUIDO' WHERE id=?";
        db.query(query, [id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Evento Finalizado com Sucesso!' });
        });
        return;
    }

    // Atualização completa
    let status_agendamento = 'ATIVO';
    if (status_pagamento === 'CONCLUIDO') status_agendamento = 'CONCLUIDO';

    const query = "UPDATE reservas SET nome_cliente=?, data_evento=?, detalhes_evento=?, status_pagamento=?, status_agendamento=? WHERE id=?";
    db.query(query, [nome_cliente, data_evento, detalhes_evento, status_pagamento, status_agendamento, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Atualizado' });
    });
});

// 5. Deletar Reserva
app.delete('/api/reservas/:id', (req, res) => {
    db.query("DELETE FROM reservas WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Deletado' });
    });
});

// 6. Galeria - Listar Fotos
app.get('/api/galeria', (req, res) => {
    db.query("SELECT * FROM galeria ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 7. Galeria - Upload
app.post('/api/galeria', upload.single('foto'), (req, res) => {
    if (!req.file) return res.status(400).send('Sem arquivo.');
    
    const { titulo, categoria } = req.body;
    const imagem_url = `/uploads/${req.file.filename}`;

    const query = "INSERT INTO galeria (titulo, categoria, imagem_url) VALUES (?, ?, ?)";
    db.query(query, [titulo, categoria, imagem_url], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Foto salva' });
    });
});

// 8. Galeria - Deletar
app.delete('/api/galeria/:id', (req, res) => {
    db.query("DELETE FROM galeria WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Foto removida' });
    });
});

// 9. Login do Admin (Critério 3: Segurança e Criptografia)
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    // Verifica email
    if (email !== EMAIL_ADMIN_SALVO) {
        return res.status(401).json({ error: 'Usuário ou senha incorretos!' });
    }

    // Verifica senha usando bcrypt
    const senhaValida = await bcrypt.compare(senha, HASH_SENHA_SALVA);

    if (senhaValida) {
        res.json({ message: 'Login autorizado!' });
    } else {
        res.status(401).json({ error: 'Usuário ou senha incorretos!' });
    }
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📂 Site servido da pasta: client`);
});