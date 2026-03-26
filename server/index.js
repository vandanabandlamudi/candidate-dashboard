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
      SELECT c.id, c.name, c.email, c.phone, c.exp, c.title, c.company, c.summary, c.skills,
             c.applied_date AS "appliedDate",
             r.name AS role, s.label AS status
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
      SELECT c.id, c.name, c.email, c.phone, c.exp, c.title, c.company, c.summary, c.skills,
             c.applied_date AS "appliedDate",
             r.name AS role, s.label AS status
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
  const body = { ...req.body };
  try {
    // Resolve status label → status_id
    if (body.status) {
      const s = await pool.query('SELECT id FROM statuses WHERE label = $1', [body.status]);
      if (s.rows.length) { body.status_id = s.rows[0].id; }
      delete body.status;
    }
    // Resolve role name → role_id
    if (body.role) {
      const r = await pool.query('SELECT id FROM roles WHERE name = $1', [body.role]);
      if (r.rows.length) { body.role_id = r.rows[0].id; }
      delete body.role;
    }
    // Drop non-column fields
    delete body.sentQuestions;
    delete body.assessments;
    delete body.interview;

    const keys   = Object.keys(body);
    const values = Object.values(body);
    if (keys.length === 0) return res.json({});
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
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

// --- Question Papers ---
app.get('/api/papers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM question_papers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/papers', async (req, res) => {
  const { id, title, questions } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO question_papers (id, title, questions) VALUES ($1, $2, $3) RETURNING *`,
      [id, title, JSON.stringify(questions ?? [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/papers/:id', async (req, res) => {
  const { title, questions } = req.body;
  try {
    const result = await pool.query(
      `UPDATE question_papers SET title = COALESCE($1, title), questions = COALESCE($2, questions) WHERE id = $3 RETURNING *`,
      [title ?? null, questions ? JSON.stringify(questions) : null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/papers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM question_papers WHERE id = $1', [req.params.id]);
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

// --- Darwinbox Jobs Proxy ---
app.get('/api/darwinbox/jobs', async (req, res) => {
  try {
    const response = await fetch(`https://${process.env.DARWINBOX_SUBDOMAIN}.darwinbox.in/JobsApiv3/Joblist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.DARWINBOX_API_KEY,
        job_updated_timestamp_from: process.env.DARWINBOX_FROM_DATE || '01-01-2020 00:00:00',
      }),
    });
    const data = await response.json();
    if (data.status !== 1) {
      return res.status(502).json({ error: data.message || 'Darwinbox error' });
    }
    res.json(data.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
