#!/usr/bin/env node

/**
 * Script para criar o primeiro usuário administrador
 * Uso: node scripts/create_admin.js <email> <password> <name>
 */

import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, ensureDatabase } from '../src/db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

const createAdmin = async (email, password, name) => {
    try {
        // Garantir que o banco está inicializado
        await ensureDatabase();
        const db = await getDb();
        
        // Verificar se já existe um admin com este email
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);
        
        if (existingUser) {
            console.error(`❌ Erro: Já existe um usuário com o email ${email}`);
            await db.close();
            process.exit(1);
        }
        
        // Hash da senha
        const hashedPassword = hashPassword(password);
        
        // Inserir novo admin
        const result = await db.run(`
            INSERT INTO users (email, name, provider, provider_id, role, password)
            VALUES (?, ?, 'local', ?, 'admin', ?)
        `, email, name, `local_${Date.now()}`, hashedPassword);
        
        console.log('✅ Administrador criado com sucesso!');
        console.log(`   ID: ${result.lastID}`);
        console.log(`   Email: ${email}`);
        console.log(`   Nome: ${name}`);
        console.log(`   Role: admin`);
        console.log('\n🔑 Use estas credenciais para fazer login no dashboard admin.');
        
        await db.close();
        
    } catch (error) {
        console.error('❌ Erro ao criar administrador:', error.message);
        process.exit(1);
    }
};

// Validação de argumentos
const args = process.argv.slice(2);

if (args.length < 3) {
    console.error('❌ Uso: node scripts/create_admin.js <email> <password> <name>');
    console.error('   Exemplo: node scripts/create_admin.js admin@example.com senha123 "Admin Sistema"');
    process.exit(1);
}

const [email, password, name] = args;

// Validações básicas
if (!email.includes('@')) {
    console.error('❌ Email inválido');
    process.exit(1);
}

if (password.length < 6) {
    console.error('❌ Senha deve ter pelo menos 6 caracteres');
    process.exit(1);
}

// Executar criação
createAdmin(email, password, name);
