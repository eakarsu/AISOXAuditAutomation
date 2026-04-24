const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

function createCrudRouter(tableName, idColumn, aiFields = {}) {
  const router = express.Router();

  // GET all
  router.get('/', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET one
  router.get('/:id', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', auth, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      const values = keys.map(k => req.body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const result = await pool.query(
        `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', auth, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'created_at');
      const values = keys.map(k => req.body[k]);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', auth, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
