import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pool from './db.js';
import { getFolderIdForRole, pickRandomDocFromFolder, exportDocAsText } from './drive.js';
import { parseMcq } from './parseMcq.js';

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
  const { id, title, role, questions } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO question_papers (id, title, role, questions) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, title, role ?? null, JSON.stringify(questions ?? [])]
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

// All submissions across all papers (for admin dashboard)
app.get('/api/submissions', async (_req, res) => {
  try {
    const subs = await pool.query(`
      SELECT s.id, s.candidate_id, s.paper_id, s.correction_mode, s.submitted_at,
             s.auto_score, s.auto_max, s.total_max
      FROM submissions s
      ORDER BY s.submitted_at DESC
    `);
    const answers = await pool.query(`
      SELECT sa.submission_id, sa.question_id, sa.answer, sa.correct, sa.auto_graded, sa.marks, sa.max_marks
      FROM submission_answers sa
    `);
    const answersBySubmission = {}
    for (const a of answers.rows) {
      if (!answersBySubmission[a.submission_id]) answersBySubmission[a.submission_id] = []
      answersBySubmission[a.submission_id].push(a)
    }
    const result = subs.rows.map((s) => ({
      ...s,
      answers: answersBySubmission[s.id] ?? [],
    }))
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pending (not yet submitted) test tokens
app.get('/api/tokens/pending', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT tt.token, tt.created_at,
             c.id AS candidate_id, c.name AS candidate_name, c.email AS candidate_email,
             r.name AS candidate_role,
             qp.id AS paper_id, qp.title AS paper_title
      FROM test_tokens tt
      JOIN candidates c ON tt.candidate_id = c.id
      LEFT JOIN roles r ON c.role_id = r.id
      JOIN question_papers qp ON tt.paper_id = qp.id
      WHERE tt.submitted_at IS NULL
      ORDER BY tt.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Drive Import ---
const KNOWN_ROLES = ['Senior Frontend Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer'];

app.post('/api/papers/import-from-drive', async (req, res) => {
  const { role } = req.body;
  if (!KNOWN_ROLES.includes(role)) {
    return res.status(400).json({ error: `Unknown role: ${role}` });
  }
  try {
    const folderId = await getFolderIdForRole(role);
    if (!folderId) return res.status(404).json({ error: `No Drive subfolder found for role: ${role}` });

    const doc = await pickRandomDocFromFolder(folderId);
    if (!doc) return res.status(404).json({ error: `No supported files found in Drive folder for role: ${role}. Add a Google Doc, PDF, DOCX, or TXT file.` });

    const rawText = await exportDocAsText(doc.fileId, doc.mimeType);
    const questions = parseMcq(rawText);
    if (questions.length === 0) {
      return res.status(400).json({ error: `Could not parse any MCQ questions from "${doc.fileName}". Check the document format.` });
    }

    const id = `paper_${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO question_papers (id, title, role, questions) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, doc.fileName, role, JSON.stringify(questions)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Assign paper → generate shareable test token ---
app.post('/api/papers/:paperId/assign', async (req, res) => {
  const { candidateId } = req.body;
  const { paperId } = req.params;
  try {
    const paper = await pool.query('SELECT id FROM question_papers WHERE id = $1', [paperId]);
    if (!paper.rows.length) return res.status(404).json({ error: 'Paper not found' });

    const candidate = await pool.query('SELECT id FROM candidates WHERE id = $1', [candidateId]);
    if (!candidate.rows.length) return res.status(404).json({ error: 'Candidate not found' });

    // Replace any existing pending token for this candidate+paper
    await pool.query(
      'DELETE FROM test_tokens WHERE candidate_id = $1 AND paper_id = $2 AND submitted_at IS NULL',
      [candidateId, paperId]
    );
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO test_tokens (token, candidate_id, paper_id) VALUES ($1, $2, $3)',
      [token, candidateId, paperId]
    );
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public test routes (no auth) ---
app.get('/api/test/:token', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tt.submitted_at,
             c.id AS candidate_id, c.name AS candidate_name, c.email AS candidate_email,
             qp.id AS paper_id, qp.title AS paper_title, qp.role AS paper_role, qp.questions
      FROM test_tokens tt
      JOIN candidates c ON tt.candidate_id = c.id
      JOIN question_papers qp ON tt.paper_id = qp.id
      WHERE tt.token = $1
    `, [req.params.token]);

    if (!result.rows.length) return res.status(404).json({ error: 'Invalid or expired test link.' });

    const row = result.rows[0];
    res.json({
      alreadySubmitted: !!row.submitted_at,
      candidate: { id: row.candidate_id, name: row.candidate_name, email: row.candidate_email },
      paper: {
        id: row.paper_id,
        title: row.paper_title,
        role: row.paper_role,
        questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test/:token/submit', async (req, res) => {
  const { answers, correctionMode } = req.body;
  try {
    const tokenRow = await pool.query(
      'SELECT candidate_id, paper_id, submitted_at FROM test_tokens WHERE token = $1',
      [req.params.token]
    );
    if (!tokenRow.rows.length) return res.status(404).json({ error: 'Invalid test link.' });
    if (tokenRow.rows[0].submitted_at) return res.status(409).json({ error: 'Test already submitted.' });

    const { candidate_id, paper_id } = tokenRow.rows[0];

    // Load paper to calculate scores
    const paperRow = await pool.query('SELECT questions FROM question_papers WHERE id = $1', [paper_id]);
    const questions = typeof paperRow.rows[0].questions === 'string'
      ? JSON.parse(paperRow.rows[0].questions)
      : paperRow.rows[0].questions;

    let autoScore = 0;
    let autoMax = 0;
    const totalMax = questions.reduce((s, q) => s + (q.marks ?? 1), 0);

    const answerRows = questions.map((q) => {
      const answer = answers[q.id] ?? null;
      let correct = null;
      let autoGraded = false;
      let marks = null;

      if (q.type === 'mcq' && correctionMode === 'auto') {
        autoGraded = true;
        correct = answer === q.correctOption;
        marks = correct ? (q.marks ?? 1) : 0;
        autoMax += (q.marks ?? 1);
        autoScore += marks;
      }
      return { questionId: q.id, answer, correct, autoGraded, marks, maxMarks: q.marks ?? 1 };
    });

    const now = new Date().toISOString();
    const sub = await pool.query(
      `INSERT INTO submissions (candidate_id, paper_id, correction_mode, submitted_at, auto_score, auto_max, total_max)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [candidate_id, paper_id, correctionMode ?? 'auto', now, autoScore, autoMax, totalMax]
    );
    const submissionId = sub.rows[0].id;

    for (const a of answerRows) {
      await pool.query(
        `INSERT INTO submission_answers (submission_id, question_id, answer, correct, auto_graded, marks, max_marks)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [submissionId, a.questionId, a.answer !== null ? String(a.answer) : null, a.correct, a.autoGraded, a.marks, a.maxMarks]
      );
    }

    await pool.query('UPDATE test_tokens SET submitted_at = $1 WHERE token = $2', [now, req.params.token]);

    // Auto-advance or auto-reject based on MCQ score (exclusively MCQ papers only)
    if (correctionMode === 'auto' && autoMax > 0 && autoMax === totalMax) {
      const pct = autoScore / autoMax;
      if (pct >= 0.8) {
        // Advance to next round using next_status_id
        await pool.query(`
          UPDATE candidates SET status_id = (
            SELECT s.next_status_id FROM statuses s
            JOIN candidates c ON c.status_id = s.id
            WHERE c.id = $1
          ) WHERE id = $1 AND (
            SELECT next_status_id FROM statuses WHERE id = (SELECT status_id FROM candidates WHERE id = $1)
          ) IS NOT NULL
        `, [candidate_id]);
      } else {
        // Reject
        await pool.query(
          'UPDATE candidates SET status_id = (SELECT id FROM statuses WHERE label = $1) WHERE id = $2',
          ['Rejected', candidate_id]
        );
      }
    }

    res.status(201).json({ submissionId });
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
