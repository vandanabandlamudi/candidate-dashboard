import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// --- Candidates ---
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, r.name AS role, s.label AS status
      FROM candidates c
      LEFT JOIN roles r ON c.role_id = r.id
      LEFT JOIN statuses s ON c.status_id = s.id
      ORDER BY c.applied_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/candidates/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, r.name AS role, s.label AS status
      FROM candidates c
      LEFT JOIN roles r ON c.role_id = r.id
      LEFT JOIN statuses s ON c.status_id = s.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates', async (req, res) => {
  const { name, email, phone, role_id, status_id, exp, title, company, applied_date, summary } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO candidates (name, email, phone, role_id, status_id, exp, title, company, applied_date, summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, email, phone, role_id, status_id, exp, title, company, applied_date, summary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/candidates/:id', async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  try {
    const result = await pool.query(
      `UPDATE candidates SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM candidates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Roles ---
app.get('/api/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Statuses ---
app.get('/api/statuses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM statuses ORDER BY order_index');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Questions ---
app.get('/api/questions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, r.name AS role_name
      FROM questions q
      LEFT JOIN roles r ON q.role_id = r.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Interviews ---
app.get('/api/candidates/:id/interviews', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM interviews WHERE candidate_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates/:id/interviews', async (req, res) => {
  const { date, time, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO interviews (candidate_id, date, time, type) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, date, time, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Submissions ---
app.get('/api/candidates/:id/submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM submissions WHERE candidate_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
