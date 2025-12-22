-- ARQUIVO ÚNICO DE BANCO DE DADOS - RAUBER FESTAS
-- Contém: Estrutura das tabelas + Atualização de Status + Usuário Admin

-- 1. Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS rauber_db;
USE rauber_db;

-- 2. Tabela de Reservas
-- Já atualizada com o status 'CONCLUIDO' para permitir finalizar eventos
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cliente VARCHAR(255) NOT NULL,
    data_evento DATE NOT NULL,
    detalhes_evento TEXT,
    status_pagamento ENUM('NAO_PAGO', 'PARCIAL', 'PAGO', 'CONCLUIDO') DEFAULT 'NAO_PAGO',
    status_agendamento ENUM('ATIVO', 'CONCLUIDO', 'CANCELADO') DEFAULT 'ATIVO',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Galeria
CREATE TABLE IF NOT EXISTS galeria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    categoria VARCHAR(50),
    imagem_url VARCHAR(255) NOT NULL,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Usuários Administrativos
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- 5. Usuário Admin de Teste
-- Cria um usuário inicial para não começar com a tabela vazia
INSERT INTO admin_users (email, senha) VALUES ('admin@rauber.com', 'rauber123');