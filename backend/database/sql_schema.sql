-- ============================================================
-- Automated Essay Scoring System — PostgreSQL Schema (3NF)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. USERS (Teachers & Students separated for 3NF clarity)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE teachers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    department    VARCHAR(100),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    grade_level   SMALLINT CHECK (grade_level BETWEEN 1 AND 13),
    enrolled_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. COURSES & ENROLLMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    subject         VARCHAR(100) NOT NULL,
    teacher_id      UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    academic_year   VARCHAR(10) NOT NULL,          -- e.g. "2025-26"
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_enrollments (
    student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, course_id)
);

-- ─────────────────────────────────────────────────────────────
-- 3. LEARNING OBJECTIVES & STANDARDS (3NF — no repeating groups)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE learning_objectives (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description     TEXT NOT NULL,
    standard_code   VARCHAR(50),                  -- e.g. "CCSS.ELA-LITERACY.W.9-10.1"
    domain          VARCHAR(100),                 -- e.g. "Argumentative Writing"
    grade_band      VARCHAR(20)                   -- e.g. "9-10"
);

-- ─────────────────────────────────────────────────────────────
-- 4. RUBRICS (header only; full config stored in MongoDB)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE rubrics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    created_by      UUID REFERENCES teachers(id),
    is_published    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 5. ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rubric_id       UUID REFERENCES rubrics(id),
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    due_date        TIMESTAMPTZ,
    max_score       NUMERIC(5,2) NOT NULL DEFAULT 100,
    word_limit      INT,                          -- optional word count cap
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3NF junction: assignment ↔ learning_objectives (avoids repeating groups)
CREATE TABLE assignment_objectives (
    assignment_id       UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    learning_obj_id     UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
    PRIMARY KEY (assignment_id, learning_obj_id)
);

-- ─────────────────────────────────────────────────────────────
-- 6. SUBMISSIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    word_count      INT,
    status          VARCHAR(30) DEFAULT 'submitted'
                    CHECK (status IN ('draft','submitted','scoring','scored','returned')),
    version         SMALLINT DEFAULT 1
);

-- ─────────────────────────────────────────────────────────────
-- 7. SCORES (Multi-trait — one row per trait per submission)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE trait_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) UNIQUE NOT NULL,  -- e.g. "Grammar", "Coherence"
    description     TEXT,
    default_weight  NUMERIC(4,2) DEFAULT 1.0
);

CREATE TABLE scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id   UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    trait_id        UUID NOT NULL REFERENCES trait_definitions(id),
    raw_score       NUMERIC(5,2) NOT NULL,
    max_score       NUMERIC(5,2) NOT NULL,
    weight          NUMERIC(4,2) DEFAULT 1.0,
    scored_by       VARCHAR(20) DEFAULT 'automated'
                    CHECK (scored_by IN ('automated','teacher','peer')),
    scored_at       TIMESTAMPTZ DEFAULT NOW(),
    notes           TEXT
);

-- ─────────────────────────────────────────────────────────────
-- 8. GRADE BOUNDARIES (3NF — per assignment, not embedded)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE grade_boundaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    min_score       NUMERIC(5,2) NOT NULL,
    max_score       NUMERIC(5,2) NOT NULL,
    grade_letter    VARCHAR(3) NOT NULL,          -- A+, A, B, C, D, F
    descriptor      VARCHAR(100),                 -- "Excellent", "Proficient", etc.
    CHECK (min_score < max_score)
);

-- ─────────────────────────────────────────────────────────────
-- 9. SKILL MAPPINGS (3NF — trait ↔ learning_objective)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE skill_mappings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trait_id            UUID NOT NULL REFERENCES trait_definitions(id),
    learning_obj_id     UUID NOT NULL REFERENCES learning_objectives(id),
    weight_factor       NUMERIC(4,2) DEFAULT 1.0,
    UNIQUE (trait_id, learning_obj_id)
);

-- ─────────────────────────────────────────────────────────────
-- 10. PEER REVIEW
-- ─────────────────────────────────────────────────────────────

CREATE TABLE peer_review_assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id       UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assigned_at         TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed')),
    UNIQUE (submission_id, reviewer_student_id)
);

-- ─────────────────────────────────────────────────────────────
-- 11. PLAGIARISM RESULTS (SQL summary; detail in MongoDB)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE plagiarism_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id       UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    overall_similarity  NUMERIC(5,2),             -- 0–100 percentage
    flagged             BOOLEAN DEFAULT FALSE,
    checked_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES for query performance
-- ─────────────────────────────────────────────────────────────

CREATE INDEX idx_submissions_student   ON submissions(student_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_scores_submission      ON scores(submission_id);
CREATE INDEX idx_scores_trait           ON scores(trait_id);
CREATE INDEX idx_assignments_course     ON assignments(course_id);
CREATE INDEX idx_enrollments_student    ON course_enrollments(student_id);
