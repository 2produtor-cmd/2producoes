import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { verificarToken } from './middleware.js';
import authRoutes from './routes/auth.js';
import projetosRoutes from './routes/projetos.js';
import inscricoesRoutes from './routes/inscricoes.js';
import eventosRoutes from './routes/eventos.js';
import financeiroRoutes from './routes/financeiro.js';
import pessoasRoutes from './routes/pessoas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pool de conexão com PostgreSQL
const dbUrl = process.env.DATABASE_URL || process.env.DB_URL || '';
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

const isLocalhost = !dbUrl ||
  dbUrl.includes('localhost') || 
  dbUrl.includes('127.0.0.1');

// Validação de segurança para placeholders comuns
const cleanDbUrl = dbUrl.replace('postgress:', 'postgres:'); // Corrige erro comum de digitação

const poolConfig = cleanDbUrl 
  ? { connectionString: cleanDbUrl }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || (isProduction ? 'localhost' : 'localhost'),
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

// Detectar se o hostname "base" ou "host" (placeholders de exemplo) estão sendo usados
const isUsingPlaceholder = (cleanDbUrl && (cleanDbUrl.includes('@base') || cleanDbUrl.includes('@host'))) ||
                           (poolConfig.host === 'base' || poolConfig.host === 'host');

if (isProduction && isUsingPlaceholder) {
  console.error('❌ ERRO CRÍTICO: O hostname do banco de dados está configurado com um valor de exemplo ("base" ou "host"). Verifique suas variáveis de ambiente no Render.');
}

export const pool = new Pool({
  ...poolConfig,
  // Render e outros serviços de nuvem exigem SSL
  ssl: (isProduction && !isLocalhost) ? { rejectUnauthorized: false } : false
});

// Testar conexão
pool.on('error', (err) => {
  console.error('Erro no pool de conexões:', err);
});

const testConnection = async (retries = 5) => {
  while (retries) {
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('✅ Conectado ao PostgreSQL:', res.rows[0].now);
      break;
    } catch (err) {
      console.error(`❌ Erro de conexão (${retries} tentativas restantes):`, err.message);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

testConnection();

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/projetos', projetosRoutes);
app.use('/api/inscricoes', inscricoesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/pessoas', pessoasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Modo: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
    console.log(`🔗 Conexão: ${dbUrl ? 'DATABASE_URL detectada' : 'Usando variáveis individuais'}`);
  });
}

export default app;
