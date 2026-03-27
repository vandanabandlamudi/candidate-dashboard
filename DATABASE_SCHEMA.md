# Candidate Dashboard — Database Schema

## Tables

---

### 1. `candidates`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | Auto increment |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(150) | Unique |
| phone | VARCHAR(20) | |
| role | VARCHAR(100) | FK → roles.name |
| status | VARCHAR(50) | FK → statuses.label |
| exp | INT | Years of experience |
| title | VARCHAR(100) | Current job title |
| company | VARCHAR(100) | Current employer |
| applied_date | DATE | |
| summary | TEXT | Brief candidate summary |

---

### 2. `statuses`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| label | VARCHAR(50) | e.g. 'Screening', 'Interview R1' |
| order | INT | Pipeline order (0–5) |
| next_status_id | INT | FK → statuses.id (pipeline progression) |

**Values:** Shortlist → Screen → Interview R1 → Interview R2 → Interview R3 → Offer / Reject

---

### 3. `roles`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| name | VARCHAR(100) | e.g. 'Senior Frontend Engineer' |

**Values:** Senior Frontend Engineer, Product Manager, Data Scientist, DevOps Engineer

---

### 4. `questions`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(10) PK | e.g. 'fe1', 'pm1', 'ds1', 'dv1' |
| role_id | INT | FK → roles.id |
| text | TEXT | Question content |
| type | ENUM('mcq', 'open-ended') | Question type |
| set | INT | 15 questions in one set | 

**Note:** 15 questions per role, 60 total.

---

### 5. `question_papers`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(50) PK | Format: `paper_{timestamp}` |
| title | VARCHAR(200) | |
| created_at | TIMESTAMP | |

---

### 6. `paper_questions`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| paper_id | VARCHAR(50) | FK → question_papers.id |
| question_id | VARCHAR(10) | FK → questions.id |
| marks | INT | Max marks (default 1) |
| correct_option | VARCHAR(255) | For MCQs only |

---

### 7. `interviews`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| candidate_id | INT | FK → candidates.id |
| date | DATE | Scheduled date |
| time | TIME | Scheduled time |
| type | VARCHAR(50) | Round type / interview type |

---

### 8. `sent_questions`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| candidate_id | INT | FK → candidates.id |
| question_id | VARCHAR(10) | FK → questions.id |
| sent_at | TIMESTAMP | |

---

### 9. `submissions`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| candidate_id | INT | FK → candidates.id |
| paper_id | VARCHAR(50) | FK → question_papers.id |
| correction_mode | ENUM('auto', 'manual') | |
| submitted_at | TIMESTAMP | |
| auto_score | INT | Score from auto-graded MCQs |
| auto_max | INT | Max marks from auto-graded MCQs |
| total_max | INT | Total maximum marks in paper |

---

### 10. `submission_answers`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| submission_id | INT | FK → submissions.id |
| question_id | VARCHAR(10) | FK → questions.id |
| answer | TEXT | Candidate's answer |
| correct | BOOLEAN | NULL = pending manual review |
| auto_graded | BOOLEAN | True for MCQs in auto mode |
| marks | INT | Marks obtained (NULL = pending) |
| max_marks | INT | Maximum marks for this question |

---

### 11. `assessments`
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| candidate_id | INT | FK → candidates.id |
| question_id | VARCHAR(10) | FK → questions.id |
| score | INT | Score given by reviewer |
| notes | TEXT | Reviewer notes |

---

## Relationships

```
roles ──< candidates
roles ──< questions
statuses ──< candidates

candidates ──< interviews
candidates ──< sent_questions >── questions
candidates ──< submissions ──< submission_answers >── questions
candidates ──< assessments >── questions

question_papers ──< paper_questions >── questions
question_papers ──< submissions
```

---

## Entity Relationship Summary

| Table | Relates To | Relationship |
|---|---|---|
| candidates | roles | Many-to-One |
| candidates | statuses | Many-to-One |
| candidates | interviews | One-to-Many |
| candidates | sent_questions | One-to-Many |
| candidates | submissions | One-to-Many |
| candidates | assessments | One-to-Many |
| submissions | submission_answers | One-to-Many |
| submissions | question_papers | Many-to-One |
| paper_questions | question_papers | Many-to-One |
| paper_questions | questions | Many-to-One |
| questions | roles | Many-to-One |
