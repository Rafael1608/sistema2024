-- Criando o banco de dados e tabelas principais
CREATE DATABASE IF NOT EXISTS mercado_db;
USE mercado_db;

-- Tabela para armazenar informações dos mercados
CREATE TABLE IF NOT EXISTS mercados (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    endereco VARCHAR(100) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para armazenar informações dos produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    descricao VARCHAR(255),  -- Aumentado o tamanho para uma descrição mais longa
    preco DECIMAL(10, 2) NOT NULL,  -- Usando DECIMAL para garantir precisão no preço
    quantidade INT NOT NULL DEFAULT 0,
    mercado_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mercado_id
        FOREIGN KEY (mercado_id) REFERENCES mercados(id) ON DELETE CASCADE
);

-- Tabela para registrar movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'saida') NOT NULL,
    quantidade INT NOT NULL,
    data_movimentacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    produto_id INT NOT NULL,
    mercado_id INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produto_id
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    CONSTRAINT fk_mercado_id_mov
        FOREIGN KEY (mercado_id) REFERENCES mercados(id) ON DELETE CASCADE
);

-- Tabela para armazenar usuários com login e senha
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);


-- Consultas para verificar as tabelas
SELECT * FROM mercados;
SELECT * FROM produtos;
SELECT * FROM movimentacoes;
SELECT * FROM usuarios;
SHOW TABLES;
