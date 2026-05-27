import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../server.js';

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha: password } = req.body;

    if (!email || password === undefined) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`[Auth] Tentativa de login falhou: usuário ${email} não encontrado.`);
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const user = result.rows[0];

    // Verificar senha
    console.log(`[Auth] Verificando senha para ${email} (tamanho recebido: ${password.length} caracteres)`);
    const senhaCorreta = await bcrypt.compare(password, user.senha);
    if (!senhaCorreta) {
      console.log(`[Auth] Tentativa de login falhou: senha incorreta para ${email}. Hash no banco: ${user.senha.length} chars.`);
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('ERRO: JWT_SECRET não definida no arquivo .env');
      return res.status(500).json({ erro: 'Erro interno de configuração do servidor' });
    }

    // Gerar JWT
    console.log(`[Auth] Login bem-sucedido: ${email}`);
    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        perfil: user.role
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// POST /auth/register (opcional)
router.post('/register', async (req, res) => {
  try {
    const { email, senha: password, nome } = req.body;

    if (!email || password === undefined || !nome) {
      return res.status(400).json({ erro: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const existing = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(password, 10);

    // Inserir novo usuário
    const result = await pool.query(
      'INSERT INTO usuarios (email, senha, nome, role) VALUES ($1, $2, $3, $4) RETURNING id, email, nome',
      [email, senhaHash, nome, 'user']
    );

    const user = result.rows[0];

    // Gerar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      usuario: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        perfil: 'user'
      }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ erro: 'Erro ao registrar' });
  }
});

export default router;
