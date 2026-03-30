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
    summary      TEXT,
    skills       TEXT[]
);

-- 4. questions
CREATE TABLE IF NOT EXISTS questions (
    id             VARCHAR(50) PRIMARY KEY,
    role_id        INT NOT NULL REFERENCES roles(id),
    text           TEXT NOT NULL,
    type           VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'open-ended')),
    set_number     INT,
    option_a       TEXT,
    option_b       TEXT,
    option_c       TEXT,
    option_d       TEXT,
    correct_option VARCHAR(1)
);

-- 5. question_papers
CREATE TABLE IF NOT EXISTS question_papers (
    id         VARCHAR(50) PRIMARY KEY,
    title      VARCHAR(200),
    role       VARCHAR(100),
    questions  JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. interviews
CREATE TABLE IF NOT EXISTS interviews (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id),
    date         DATE,
    time         TIME,
    type         VARCHAR(50),
    meet_link    TEXT
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
    question_id   VARCHAR(100) NOT NULL,
    answer        TEXT,
    correct       BOOLEAN DEFAULT NULL,
    auto_graded   BOOLEAN DEFAULT FALSE,
    marks         INT DEFAULT NULL,
    max_marks     INT NOT NULL
);

-- 11. jobs
CREATE TABLE IF NOT EXISTS jobs (
    id                    SERIAL PRIMARY KEY,
    job_id                VARCHAR(50) NOT NULL UNIQUE,
    job_code              VARCHAR(20),
    group_company         VARCHAR(100),
    parent_department     VARCHAR(100),
    department            VARCHAR(100),
    division              VARCHAR(100),
    business_unit         VARCHAR(50),
    location              TEXT[],
    location_city         TEXT[],
    location_country      VARCHAR(50),
    job_title             VARCHAR(200) NOT NULL,
    post_on_careers_page  INT DEFAULT 0,
    post_on_refer_page    INT DEFAULT 0,
    post_on_ijp_page      INT DEFAULT 0,
    employee_type         VARCHAR(50),
    job_created_timestamp VARCHAR(30),
    job_updated_timestamp VARCHAR(30),
    experience_from       VARCHAR(10),
    experience_to         VARCHAR(10),
    is_remote             INT DEFAULT 0,
    salary_min            VARCHAR(20),
    salary_max            VARCHAR(20)
);

-- 12. screening_results
CREATE TABLE IF NOT EXISTS screening_results (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_title    VARCHAR(200),
    department   VARCHAR(200),
    score        INT NOT NULL,
    verdict      VARCHAR(50) NOT NULL,
    reasons      TEXT[] NOT NULL DEFAULT '{}',
    concern      TEXT,
    review_only  BOOLEAN NOT NULL DEFAULT FALSE,
    screened_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (candidate_id)
);

-- 13. settings
CREATE TABLE IF NOT EXISTS settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT
);
INSERT INTO settings (key, value) VALUES ('organizer_email', 'vandana.bandlamudi@scripbox.com') ON CONFLICT (key) DO NOTHING;

-- 14. assessments
CREATE TABLE IF NOT EXISTS assessments (
    id           SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id),
    question_id  VARCHAR(10) NOT NULL REFERENCES questions(id),
    score        INT,
    notes        TEXT,
    UNIQUE (candidate_id, question_id)
);
