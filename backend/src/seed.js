import { pool } from './server.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes
    console.log('🗑️  Limpando dados existentes...');
    await pool.query('TRUNCATE TABLE pessoas CASCADE');
    await pool.query('TRUNCATE TABLE financeiro CASCADE');
    await pool.query('TRUNCATE TABLE eventos CASCADE');
    await pool.query('TRUNCATE TABLE inscricoes CASCADE');
    await pool.query('TRUNCATE TABLE projetos CASCADE');
    await pool.query('TRUNCATE TABLE usuarios CASCADE');

    // Criar usuários
    console.log('👤 Criando usuários...');
    const senhaHash = await bcrypt.hash('admin123', 10);
    
    await pool.query(
      'INSERT INTO usuarios (email, senha, nome, role) VALUES ($1, $2, $3, $4)',
      ['admin@2producoes.com.br', senhaHash, 'Administrador', 'admin']
    );

    // Criar projetos
    console.log('📋 Criando projetos...');
    const projeto1 = uuidv4();
    const projeto2 = uuidv4();
    
    await pool.query(
      'INSERT INTO projetos (id, nome, descricao, status) VALUES ($1, $2, $3, $4)',
      [projeto1, 'Festival de Artes', 'Festival anual de artes culturais', 'ativo']
    );
    
    await pool.query(
      'INSERT INTO projetos (id, nome, descricao, status) VALUES ($1, $2, $3, $4)',
      [projeto2, 'Workshop de Teatro', 'Oficina de teatro para iniciantes', 'ativo']
    );

    // Criar inscrições
    console.log('📝 Criando inscrições...');
    await pool.query(
      'INSERT INTO inscricoes (id, projeto_id, nome_completo, email, status) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), projeto1, 'João Silva', 'joao@email.com', 'confirmada']
    );
    
    await pool.query(
      'INSERT INTO inscricoes (id, projeto_id, nome_completo, email, status) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), projeto1, 'Maria Santos', 'maria@email.com', 'pendente']
    );

    // Criar eventos
    console.log('📅 Criando eventos...');
    await pool.query(
      'INSERT INTO eventos (id, nome, data, descricao, local) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), 'Abertura do Festival', '2026-06-15', 'Evento de abertura', 'Teatro Municipal']
    );
    
    await pool.query(
      'INSERT INTO eventos (id, nome, data, descricao, local) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), 'Workshop Prático', '2026-06-20', 'Prática de teatro', 'Estúdio de Artes']
    );

    // Criar financeiro
    console.log('💰 Criando dados financeiros...');
    await pool.query(
      'INSERT INTO financeiro (id, mes, entradas, saidas) VALUES ($1, $2, $3, $4)',
      [uuidv4(), '2026-05', 5000.00, 2000.00]
    );
    
    await pool.query(
      'INSERT INTO financeiro (id, mes, entradas, saidas) VALUES ($1, $2, $3, $4)',
      [uuidv4(), '2026-06', 8000.00, 3500.00]
    );

    // Criar pessoas
    console.log('👥 Criando pessoas...');
    await pool.query(
      'INSERT INTO pessoas (id, nome, email, telefone, papel) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), 'João Silva', 'joao@email.com', '11987654321', 'produtor']
    );
    
    await pool.query(
      'INSERT INTO pessoas (id, nome, email, telefone, papel) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), 'Maria Santos', 'maria@email.com', '11987654322', 'coordenadora']
    );

    console.log('✅ Seed concluído com sucesso!');
    console.log('');
    console.log('📧 Credenciais de teste:');
    console.log('   Email: admin@2producoes.com.br');
    console.log('   Senha: admin123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao fazer seed:', err);
    process.exit(1);
  }
}

seed();
