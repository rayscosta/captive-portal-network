#!/usr/bin/env node

/**
 * Script de migração para adicionar campos de autenticação
 * Adiciona colunas 'role' e 'password' à tabela users
 */

import { getDb, ensureDatabase } from '../src/db/connection.js';

const migrate = async () => {
    try {
        console.log('🔄 Iniciando migração do banco de dados...');
        
        await ensureDatabase();
        const db = await getDb();
        
        // Verificar se as colunas já existem
        const tableInfo = await db.all("PRAGMA table_info(users)");
        const hasRole = tableInfo.some(col => col.name === 'role');
        const hasPassword = tableInfo.some(col => col.name === 'password');
        
        if (hasRole && hasPassword) {
            console.log('✅ Banco de dados já está atualizado!');
            await db.close();
            return;
        }
        
        // Adicionar coluna role se não existir
        if (!hasRole) {
            console.log('  📝 Adicionando coluna role...');
            await db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
        }
        
        // Adicionar coluna password se não existir
        if (!hasPassword) {
            console.log('  📝 Adicionando coluna password...');
            await db.exec("ALTER TABLE users ADD COLUMN password TEXT");
        }
        
        console.log('✅ Migração concluída com sucesso!');
        await db.close();
        
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
        process.exit(1);
    }
};

migrate();
