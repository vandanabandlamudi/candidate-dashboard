import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pool from './db.js';
import { getFolderIdForRole, pickRandomDocFromFolder, exportDocAsText, createMeetEvent } from './drive.js';
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
             r.name AS role, s.label AS status,
             i.date AS "interviewDate", i.time AS "interviewTime", i.type AS "interviewType", i.meet_link AS "meetLink"
      FROM candidates c
      LEFT JOIN roles r ON c.role_id = r.id
      LEFT JOIN statuses s ON c.status_id = s.id
      LEFT JOIN LATERAL (SELECT * FROM interviews WHERE candidate_id = c.id ORDER BY id DESC LIMIT 1) i ON true
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
  const { title, role, questions } = req.body;
  try {
    const result = await pool.query(
      `UPDATE question_papers SET title = COALESCE($1, title), role = COALESCE($2, role), questions = COALESCE($3, questions) WHERE id = $4 RETURNING *`,
      [title ?? null, role ?? null, questions ? JSON.stringify(questions) : null, req.params.id]
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
  const { date, time, type, meet_link } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO interviews (candidate_id, date, time, type, meet_link) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, date, time, type, meet_link || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/candidates/:id/interviews/meet-link', async (req, res) => {
  const { meet_link } = req.body;
  try {
    // Update the most recent interview for this candidate
    const result = await pool.query(
      `UPDATE interviews SET meet_link = $1
       WHERE id = (SELECT id FROM interviews WHERE candidate_id = $2 ORDER BY id DESC LIMIT 1)
       RETURNING *`,
      [meet_link, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No interview found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/candidates/:id/interviews', async (req, res) => {
  try {
    await pool.query('DELETE FROM interviews WHERE candidate_id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Submissions ---
app.get('/api/candidates/:id/submissions', async (req, res) => {
  try {
    const subs = await pool.query(
      `SELECT s.*, json_agg(a ORDER BY a.id) AS answers
       FROM submissions s
       LEFT JOIN submission_answers a ON a.submission_id = s.id
       WHERE s.candidate_id = $1
       GROUP BY s.id`,
      [req.params.id]
    );
    res.json(subs.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates/:id/submissions', async (req, res) => {
  const { paperId, correctionMode, submittedAt, answers, autoScore, autoMax, totalMax } = req.body;
  try {
    const sub = await pool.query(
      `INSERT INTO submissions (candidate_id, paper_id, correction_mode, submitted_at, auto_score, auto_max, total_max)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, paperId, correctionMode, submittedAt, autoScore, autoMax, totalMax]
    );
    const subId = sub.rows[0].id;
    if (answers?.length) {
      await Promise.all(answers.map((a) =>
        pool.query(
          `INSERT INTO submission_answers (submission_id, question_id, answer, correct, auto_graded, marks, max_marks)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [subId, a.questionId, a.answer, a.correct, a.autoGraded, a.marks, a.maxMarks]
        )
      ));
    }
    res.status(201).json(sub.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/candidates/:id/submissions/:paperId/grade', async (req, res) => {
  const { questionId, marks } = req.body;
  try {
    const sub = await pool.query(
      'SELECT id FROM submissions WHERE candidate_id = $1 AND paper_id = $2',
      [req.params.id, req.params.paperId]
    );
    if (!sub.rows.length) return res.status(404).json({ error: 'Submission not found' });
    await pool.query(
      'UPDATE submission_answers SET marks = $1 WHERE submission_id = $2 AND question_id = $3',
      [marks, sub.rows[0].id, questionId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sent Questions ---
app.post('/api/candidates/:id/sent-questions', async (req, res) => {
  const { questionIds } = req.body;
  try {
    await Promise.all((questionIds ?? []).map((qid) =>
      pool.query(
        'INSERT INTO sent_questions (candidate_id, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.params.id, qid]
      )
    ));
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/candidates/:id/sent-questions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*, sq.sent_at FROM sent_questions sq
       JOIN questions q ON q.id = sq.question_id
       WHERE sq.candidate_id = $1 ORDER BY sq.sent_at DESC`,
      [req.params.id]
    );
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
// --- Assessments ---
app.get('/api/candidates/:id/assessments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assessments WHERE candidate_id = $1', [req.params.id]);
    res.json(result.rows);
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
app.put('/api/candidates/:id/assessments', async (req, res) => {
  const { questionId, score, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO assessments (candidate_id, question_id, score, notes)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (candidate_id, question_id)
       DO UPDATE SET score = EXCLUDED.score, notes = EXCLUDED.notes
       RETURNING *`,
      [req.params.id, questionId, score, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Jobs ---
app.get('/api/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY job_created_timestamp DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Screening Results ---
app.get('/api/screening-results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.*, c.name AS candidate_name, c.email, r.name AS role
      FROM screening_results sr
      JOIN candidates c ON c.id = sr.candidate_id
      LEFT JOIN roles r ON c.role_id = r.id
      ORDER BY sr.screened_at DESC, sr.score DESC
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
app.post('/api/screening-results', async (req, res) => {
  const { results } = req.body; // array of { id (candidate_id), job_title, department, score, verdict, reasons, concern }
  if (!results?.length) return res.status(400).json({ error: 'results array required' });
  try {
    await Promise.all(results.map((r) =>
      pool.query(
        `INSERT INTO screening_results (candidate_id, job_title, department, score, verdict, reasons, concern, review_only)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (candidate_id) DO UPDATE SET
           job_title   = EXCLUDED.job_title,
           department  = EXCLUDED.department,
           score       = EXCLUDED.score,
           verdict     = EXCLUDED.verdict,
           reasons     = EXCLUDED.reasons,
           concern     = EXCLUDED.concern,
           review_only = CASE WHEN screening_results.review_only = TRUE THEN TRUE ELSE EXCLUDED.review_only END,
           screened_at = CURRENT_TIMESTAMP`,
        [r.id, r.job_title ?? null, r.department ?? null, r.score, r.verdict, r.reasons ?? [], r.concern ?? null, r.review_only ?? false]
      )
    ));
    res.status(201).json({ saved: results.length });
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
  const { answers } = req.body;
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

    console.log('[submit] paper_id:', paper_id, 'questions count:', questions.length);
    console.log('[submit] first question:', JSON.stringify(questions[0]));
    console.log('[submit] answers keys:', Object.keys(answers).slice(0, 3));

    const answerRows = questions.map((q) => {
      const answer = answers[q.id] ?? null;
      let correct = null;
      let autoGraded = false;
      let marks = null;

      if (q.type === 'mcq') {
        autoGraded = true;
        correct = Number(answer) === Number(q.correctOption);
        marks = correct ? (q.marks ?? 1) : 0;
        autoMax += (q.marks ?? 1);
        autoScore += marks;
      }
      console.log('[submit] q.id:', q.id, 'type:', q.type, 'answer:', answer, 'correctOption:', q.correctOption, 'correct:', correct, 'autoGraded:', autoGraded);
      return { questionId: q.id, answer, correct, autoGraded, marks, maxMarks: q.marks ?? 1 };
    });
    console.log('[submit] autoScore:', autoScore, 'autoMax:', autoMax);

    const now = new Date().toISOString();
    const client = await pool.connect();
    let submissionId;
    try {
      await client.query('BEGIN');

      const sub = await client.query(
        `INSERT INTO submissions (candidate_id, paper_id, correction_mode, submitted_at, auto_score, auto_max, total_max)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [candidate_id, paper_id, 'auto', now, autoScore, autoMax, totalMax]
      );
      submissionId = sub.rows[0].id;

      for (const a of answerRows) {
        await client.query(
          `INSERT INTO submission_answers (submission_id, question_id, answer, correct, auto_graded, marks, max_marks)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [submissionId, a.questionId, a.answer !== null ? String(a.answer) : null, a.correct, a.autoGraded, a.marks, a.maxMarks]
        );
      }

      await client.query('UPDATE test_tokens SET submitted_at = $1 WHERE token = $2', [now, req.params.token]);

      // Auto-advance or auto-reject based on MCQ score (exclusively MCQ papers only)
      if (autoMax > 0 && autoMax === totalMax) {
        if (autoScore >= 8) {
          await client.query(`
            UPDATE candidates SET status_id = (
              SELECT s.next_status_id FROM statuses s
              JOIN candidates c ON c.status_id = s.id
              WHERE c.id = $1
            ) WHERE id = $1 AND (
              SELECT next_status_id FROM statuses WHERE id = (SELECT status_id FROM candidates WHERE id = $1)
            ) IS NOT NULL
          `, [candidate_id]);
        } else {
          await client.query(
            'UPDATE candidates SET status_id = (SELECT id FROM statuses WHERE label = $1) WHERE id = $2',
            ['Rejected', candidate_id]
          );
        }
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    res.status(201).json({ submissionId });
      } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/screening-results', async (req, res) => {
  try {
    await pool.query('DELETE FROM screening_results');
    res.json({ ok: true });
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

// --- Shortlisting ---
app.post('/api/screen', async (req, res) => {
  const { job, candidates } = req.body;
  if (!job || !candidates?.length) {
    return res.status(400).json({ error: 'job and candidates are required' });
  }

  const prompt = `You are an expert recruiter conducting a first-stage shortlist screening. Evaluate each candidate strictly and fairly against the job requirements.

JOB:
- Title: ${job.job_title}
- Department: ${job.department}
- Experience required: ${job.experience_from || 0}–${job.experience_to || '∞'} years
- Salary range: ₹${job.salary_min || 'N/A'} – ₹${job.salary_max || 'N/A'}
- Type: ${job.employee_type}
- Remote: ${job.is_remote ? 'Yes' : 'No'}

CANDIDATES:
${candidates.map((c) => `ID: ${c.id}
  Name: ${c.name}
  Current title: ${c.title} at ${c.company}
  Total experience: ${c.exp} years
  Skills: ${(c.skills || []).join(', ')}
  Education: ${c.education || 'Not specified'}
  Summary: ${c.summary}`).join('\n\n')}

SCORING CRITERIA (total 100 points):
- Functional/Technical knowledge (35%): Match of skills, tools, and technical competencies to the role
- Domain knowledge (18%): Industry or domain experience relevant to this role; for risk/compliance roles, prioritize risk awareness
- Experience (12%): Total and relevant years of experience within or close to the required range
- Education (8%): Relevant degree, field of study, or institutional background
- Communication (8%): Clarity and quality of how the candidate describes their background
- Job hopping (4%): Penalize frequent short tenures (under 1 year), but DO NOT penalize career gaps — gaps are not job hopping
- Certifications (2%): Relevant certifications that complement the role

SHORTLISTING RULES:
- Must-have: Candidate must have core required skills; if missing, cap score at 40
- Must-have: Candidate must meet minimum experience threshold; if below, cap score at 50
- Do NOT penalize unexplained career gaps
- Match skills semantically, not just by keyword (e.g., "JS" = "JavaScript")
- Score on demonstrated relevance and depth, not just presence of keywords

Return ONLY a valid JSON array (no markdown, no explanation) with one object per candidate.
Use the exact numeric ID provided above for each candidate — do not change or reassign IDs.
[
  {
    "id": <exact id from above>,
    "name": "<name>",
    "score": <0-100>,
    "verdict": "Strong Match" | "Good Match" | "Partial Match" | "Not a Match",
    "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
    "concern": "<one main concern, or null if none>"
  }
]

Sort by score descending.`;

  try {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: `Ollama API error (${response.status}): ${errText.slice(0, 200)}` });
    }
    const data = await response.json();
    const content = data?.message?.content;
    if (!content) {
      return res.status(502).json({ error: `Try again...` });    
      // return res.status(502).json({ error: `Ollama returned no content. Response: ${JSON.stringify(data).slice(0, 200)}` });
    }
    
    // Extract JSON array from content (may be wrapped in markdown or have extra text)
    const raw = content.trim().replace(/```json|```/g, '').trim();
    // Find the first '[' and last ']' to extract the JSON array
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) {
       return res.status(502).json({ error: `Try again...` });   
      // return res.status(502).json({ error: `Ollama did not return a JSON array. Content: ${raw.slice(0, 300)}` });
    }
    const jsonStr = raw.slice(start, end + 1);
    let results;
    try {
      results = JSON.parse(jsonStr);
    } catch (parseErr) {
      return res.status(502).json({ error: `Failed to parse Ollama response as JSON: ${parseErr.message}. Content: ${raw.slice(0, 300)}` });
    }
    if (!Array.isArray(results)) {
       return res.status(502).json({ error: `Try again...` });   
      // return res.status(502).json({ error: 'Ollama did not return a JSON array' });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings ---
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/settings', async (req, res) => {
  const updates = req.body; // { key: value, ... }
  try {
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        pool.query(
          'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
          [key, value]
        )
      )
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Google Meet ---
app.post('/api/meet', async (req, res) => {
  const { candidateId, date, time } = req.body;
  if (!candidateId || !date || !time) {
    return res.status(400).json({ error: 'candidateId, date, and time are required' });
  }
  try {
    // Get organizer email from settings
    const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'organizer_email'");
    const organizerEmail = settingsRes.rows[0]?.value || 'careers@scripbox.com';

    // Get candidate details
    const candRes = await pool.query(
      `SELECT c.name, c.email, r.name AS role FROM candidates c LEFT JOIN roles r ON c.role_id = r.id WHERE c.id = $1`,
      [candidateId]
    );
    if (!candRes.rows.length) return res.status(404).json({ error: 'Candidate not found' });
    const { name, email, role } = candRes.rows[0];

    const result = await createMeetEvent({ organizerEmail, candidateEmail: email, candidateName: name, role, date, time });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
