import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function reset() {
  try {
    console.log('⚠️  Iniciando limpeza total do banco de dados...');
    
    // Deleta tudo no esquema public e recria (forma mais rápida de resetar)
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    
    console.log('✅ Esquema limpo com sucesso!');

    console.log('🚀 Criando tabelas e inserindo dados iniciais...');
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);

    console.log('✅ Banco de dados reiniciado e populado!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao resetar banco de dados:', err.message);
    process.exit(1);
  }
}

reset();