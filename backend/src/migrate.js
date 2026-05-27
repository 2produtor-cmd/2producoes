import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('🚀 Iniciando criação das tabelas no banco de dados...');
    
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Estrutura do banco de dados criada com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao executar migração:', err.message);
    process.exit(1);
  }
}

migrate();