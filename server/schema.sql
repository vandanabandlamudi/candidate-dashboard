-- Candidate Dashboard — PostgreSQL Schema

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. statuses
CREATE TABLE IF NOT EXISTS statuses (
    id             SERIAL PRIMARY KEY,
    label          VARCHAR(50) NOT NULL UNIQUE,
    order_index    INT NOT NULL,
    next_status_id INT REFERENCES statuses(id)
);

-- 3. candidates
CREATE TABLE IF NOT EXISTS candidates (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    phone        VARCHAR(20),
    role_id      INT REFERENCES roles(id),
    status_id    INT REFERENCES statuses(id),
    exp          INT,
    title        VARCHAR(100),
    company      VARCHAR(100),
    applied_date DATE,
    summary      TEXT
);

-- 4. questions
CREATE TABLE IF NOT EXISTS questions (
    id      VARCHAR(10) PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id),
    text    TEXT NOT NULL,
    type    VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'open-ended')),
    set     INT
);

-- 5. question_papers
CREATE TABLE IF NOT EXISTS question_papers (
    id         VARCHAR(50) PRIMARY KEY,
    title      VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. paper_questions
CREATE TABLE IF NOT EXISTS paper_questions (
    id             SERIAL PRIMARY KEY,
    paper_id       VARCHAR(50) NOT NULL REFERENCES question_papers(id),
    question_id    VARCHAR(10) NOT NULL REFERENCES questions(id),
    marks          INT DEFAULT 1,
    correct_option VARCHAR(255)
);

-- 7. interviews
CREATE TABLE IF NOT EXISTS interviews (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id),
    date         DATE,
    time         TIME,
    type         VARCHAR(50)
);

-- 8. sent_questions
CREATE TABLE IF NOT EXISTS sent_questions (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id),
    question_id  VARCHAR(10) NOT NULL REFERENCES questions(id),
    sent_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. submissions
CREATE TABLE IF NOT EXISTS submissions (
    id              SERIAL PRIMARY KEY,
    candidate_id    INT NOT NULL REFERENCES candidates(id),
    paper_id        VARCHAR(50) NOT NULL REFERENCES question_papers(id),
    correction_mode VARCHAR(10) NOT NULL CHECK (correction_mode IN ('auto', 'manual')),
    submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_score      INT DEFAULT 0,
    auto_max        INT DEFAULT 0,
    total_max       INT DEFAULT 0
);

-- 10. submission_answers
CREATE TABLE IF NOT EXISTS submission_answers (
    id            SERIAL PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES submissions(id),
    question_id   VARCHAR(10) NOT NULL REFERENCES questions(id),
    answer        TEXT,
    correct       BOOLEAN DEFAULT NULL,
    auto_graded   BOOLEAN DEFAULT FALSE,
    marks         INT DEFAULT NULL,
    max_marks     INT NOT NULL
);

-- 11. assessments
CREATE TABLE IF NOT EXISTS assessments (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id),
    question_id  VARCHAR(10) NOT NULL REFERENCES questions(id),
    score        INT,
    notes        TEXT
);
