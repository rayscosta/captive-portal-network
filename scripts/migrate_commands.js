#!/usr/bin/env node

/**
 * Script de migração para adicionar campos de execução de comandos
 * Adiciona colunas 'executed_at' e 'timeout_seconds' à tabela commands
 */

import { ensureDatabase, getDb } from '../src/db/connection.js';

const migrate = async () => {
    try {
        console.log('🔄 Iniciando migração de comandos...');
        
        await ensureDatabase();
        const db = await getDb();
        
        // Verificar se as colunas já existem
        const tableInfo = await db.all("PRAGMA table_info(commands)");
        const hasExecutedAt = tableInfo.some(col => col.name === 'executed_at');
        const hasTimeoutSeconds = tableInfo.some(col => col.name === 'timeout_seconds');
        
        if (hasExecutedAt && hasTimeoutSeconds) {
            console.log('✅ Banco de dados já está atualizado!');
            await db.close();
            return;
        }
        
        // Adicionar coluna executed_at se não existir
        if (!hasExecutedAt) {
            console.log('  📝 Adicionando coluna executed_at...');
            await db.exec("ALTER TABLE commands ADD COLUMN executed_at DATETIME");
        }
        
        // Adicionar coluna timeout_seconds se não existir
        if (!hasTimeoutSeconds) {
            console.log('  📝 Adicionando coluna timeout_seconds...');
            await db.exec("ALTER TABLE commands ADD COLUMN timeout_seconds INTEGER DEFAULT 30");
        }
        
        console.log('✅ Migração concluída com sucesso!');
        await db.close();
        
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
        process.exit(1);
    }
};

migrate();
