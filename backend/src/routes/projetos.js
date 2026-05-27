import express from 'express';
import { pool } from '../server.js';
import { verificarToken } from '../middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /projetos - Listar todos
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, descricao, status, created_at as "createdAt", updated_at as "updatedAt" FROM projetos ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar projetos:', err);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

// GET /projetos/:id - Obter um
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nome, descricao, status, created_at as "createdAt", updated_at as "updatedAt" FROM projetos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar projeto:', err);
    res.status(500).json({ error: 'Erro ao buscar projeto' });
  }
});

// POST /projetos - Criar novo
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nome, descricao, status } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO projetos (id, nome, descricao, status) VALUES ($1, $2, $3, $4) RETURNING id, nome, descricao, status, created_at as "createdAt", updated_at as "updatedAt"',
      [id, nome, descricao || null, status || 'ativo']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

// PUT /projetos/:id - Atualizar
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, status } = req.body;

    const result = await pool.query(
      'UPDATE projetos SET nome = COALESCE($2, nome), descricao = COALESCE($3, descricao), status = COALESCE($4, status), updated_at = NOW() WHERE id = $1 RETURNING id, nome, descricao, status, created_at as "createdAt", updated_at as "updatedAt"',
      [id, nome || null, descricao || null, status || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar projeto:', err);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

// DELETE /projetos/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM projetos WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar projeto:', err);
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});

export default router;
