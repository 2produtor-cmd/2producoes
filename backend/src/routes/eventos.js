import express from 'express';
import { pool } from '../server.js';
import { verificarToken } from '../middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /eventos
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, data, descricao, local FROM eventos ORDER BY data DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar eventos:', err);
    res.status(500).json({ error: 'Erro ao listar eventos' });
  }
});

// GET /eventos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nome, data, descricao, local FROM eventos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar evento:', err);
    res.status(500).json({ error: 'Erro ao buscar evento' });
  }
});

// POST /eventos
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nome, data, descricao, local } = req.body;

    if (!nome || !data) {
      return res.status(400).json({ error: 'Nome e data são obrigatórios' });
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO eventos (id, nome, data, descricao, local) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, data, descricao, local',
      [id, nome, data, descricao || null, local || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// PUT /eventos/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, data, descricao, local } = req.body;

    const result = await pool.query(
      'UPDATE eventos SET nome = COALESCE($2, nome), data = COALESCE($3, data), descricao = COALESCE($4, descricao), local = COALESCE($5, local), updated_at = NOW() WHERE id = $1 RETURNING id, nome, data, descricao, local',
      [id, nome || null, data || null, descricao || null, local || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

export default router;
