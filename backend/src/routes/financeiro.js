import express from 'express';
import { pool } from '../server.js';
import { verificarToken } from '../middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /financeiro
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, mes, entradas, saidas, CAST(entradas - saidas as DECIMAL) as saldo FROM financeiro ORDER BY mes DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar financeiro:', err);
    res.status(500).json({ error: 'Erro ao listar financeiro' });
  }
});

// GET /financeiro/:mes
router.get('/:mes', verificarToken, async (req, res) => {
  try {
    const { mes } = req.params;
    const result = await pool.query(
      'SELECT id, mes, entradas, saidas, CAST(entradas - saidas as DECIMAL) as saldo FROM financeiro WHERE mes = $1',
      [mes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Financeiro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar financeiro:', err);
    res.status(500).json({ error: 'Erro ao buscar financeiro' });
  }
});

// POST /financeiro
router.post('/', verificarToken, async (req, res) => {
  try {
    const { mes, entradas, saidas } = req.body;

    if (!mes) {
      return res.status(400).json({ error: 'Mês é obrigatório' });
    }

    const id = uuidv4();
    const resultado = await pool.query(
      'INSERT INTO financeiro (id, mes, entradas, saidas) VALUES ($1, $2, $3, $4) RETURNING id, mes, entradas, saidas, CAST(entradas - saidas as DECIMAL) as saldo',
      [id, mes, entradas || 0, saidas || 0]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao criar financeiro:', err);
    res.status(500).json({ error: 'Erro ao criar financeiro' });
  }
});

export default router;
