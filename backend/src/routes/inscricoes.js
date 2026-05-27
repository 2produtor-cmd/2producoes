import express from 'express';
import { pool } from '../server.js';
import { verificarToken } from '../middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /inscricoes
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, projeto_id as "projetoId", nome_completo as "nome_completo", email, status, criado_em as "criado_em" FROM inscricoes ORDER BY criado_em DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar inscrições:', err);
    res.status(500).json({ error: 'Erro ao listar inscrições' });
  }
});

// GET /inscricoes/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, projeto_id as "projetoId", nome_completo as "nome_completo", email, status, criado_em as "criado_em" FROM inscricoes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar inscrição:', err);
    res.status(500).json({ error: 'Erro ao buscar inscrição' });
  }
});

// POST /inscricoes
router.post('/', verificarToken, async (req, res) => {
  try {
    const { projetoId, nome_completo, email, status } = req.body;

    if (!projetoId || !nome_completo || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios: projetoId, nome_completo, email' });
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO inscricoes (id, projeto_id, nome_completo, email, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, projeto_id as "projetoId", nome_completo as "nome_completo", email, status, criado_em as "criado_em"',
      [id, projetoId, nome_completo, email, status || 'pendente']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar inscrição:', err);
    res.status(500).json({ error: 'Erro ao criar inscrição' });
  }
});

// PUT /inscricoes/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, email, status } = req.body;

    const result = await pool.query(
      'UPDATE inscricoes SET nome_completo = COALESCE($2, nome_completo), email = COALESCE($3, email), status = COALESCE($4, status) WHERE id = $1 RETURNING id, projeto_id as "projetoId", nome_completo as "nome_completo", email, status, criado_em as "criado_em"',
      [id, nome_completo, email, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar inscrição:', err);
    res.status(500).json({ error: 'Erro ao atualizar inscrição' });
  }
});

export default router;
