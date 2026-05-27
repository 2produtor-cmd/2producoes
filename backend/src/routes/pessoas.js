import express from 'express';
import { pool } from '../server.js';
import { verificarToken } from '../middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /pessoas
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, telefone, papel FROM pessoas ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar pessoas:', err);
    res.status(500).json({ error: 'Erro ao listar pessoas' });
  }
});

// GET /pessoas/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nome, email, telefone, papel FROM pessoas WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar pessoa:', err);
    res.status(500).json({ error: 'Erro ao buscar pessoa' });
  }
});

// POST /pessoas
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nome, email, telefone, papel } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO pessoas (id, nome, email, telefone, papel) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, telefone, papel',
      [id, nome, email, telefone || null, papel || 'participante']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar pessoa:', err);
    res.status(500).json({ error: 'Erro ao criar pessoa' });
  }
});

// PUT /pessoas/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, papel } = req.body;

    const result = await pool.query(
      'UPDATE pessoas SET nome = COALESCE($2, nome), email = COALESCE($3, email), telefone = COALESCE($4, telefone), papel = COALESCE($5, papel) WHERE id = $1 RETURNING id, nome, email, telefone, papel',
      [id, nome, email, telefone, papel]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar pessoa:', err);
    res.status(500).json({ error: 'Erro ao atualizar pessoa' });
  }
});

export default router;
