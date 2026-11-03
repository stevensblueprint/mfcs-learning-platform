-- Up Migration

-- Accounts and Classes

CREATE TABLE users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_provider_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text NOT NULL
    CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN')),
  account_status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (account_status IN ('ACTIVE', 'INACTIVE')),
  student_class_id integer,
  CHECK (student_class_id IS NULL OR role = 'STUDENT')
);

CREATE TABLE classes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  teacher_id integer NOT NULL REFERENCES users(id)
);

ALTER TABLE users
  ADD CONSTRAINT users_student_class_fk
  FOREIGN KEY (student_class_id) REFERENCES classes(id);

CREATE INDEX users_student_class_idx ON users(student_class_id);
CREATE INDEX classes_teacher_idx ON classes(teacher_id);
 
-- Lessons and Class Assignments

CREATE TABLE lessons (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  week_number integer NOT NULL CHECK (week_number > 0),
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED')),
  student_instructions text NOT NULL DEFAULT '',
  creator_id integer NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lessons_creator_idx ON lessons(creator_id);

CREATE FUNCTION set_lesson_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER lessons_set_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION set_lesson_updated_at();

CREATE TABLE class_lessons (
  class_id integer NOT NULL REFERENCES classes(id),
  lesson_id integer NOT NULL REFERENCES lessons(id),
  PRIMARY KEY (class_id, lesson_id)
);

CREATE INDEX class_lessons_lesson_idx ON class_lessons(lesson_id);

-- Vocabulary, Expressions, Pronunciation, and Examples

CREATE TABLE vocabulary_concepts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id integer NOT NULL REFERENCES lessons(id),
  order_num integer NOT NULL CHECK (order_num > 0),
  primary_meaning text NOT NULL,
  context_notes text,
  UNIQUE (lesson_id, order_num),
  UNIQUE (id, lesson_id)
);

CREATE TABLE chinese_expressions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  concept_id integer NOT NULL REFERENCES vocabulary_concepts(id),
  traditional_chinese text NOT NULL,
  simplified_chinese text
);

CREATE INDEX chinese_expressions_concept_idx
  ON chinese_expressions(concept_id);

CREATE TABLE pronunciations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  expression_id integer NOT NULL REFERENCES chinese_expressions(id),
  language text NOT NULL
    CHECK (language IN ('MANDARIN', 'CANTONESE')),
  romanization_system text NOT NULL
    CHECK (romanization_system IN ('PINYIN', 'JYUTPING')),
  reading text NOT NULL,
  audio_s3_key text,
  CHECK (
    (language = 'MANDARIN' AND romanization_system = 'PINYIN')
    OR
    (language = 'CANTONESE' AND romanization_system = 'JYUTPING')
  ),
  UNIQUE (expression_id, language, romanization_system, reading)
);

CREATE TABLE example_sentences (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  concept_id integer NOT NULL REFERENCES vocabulary_concepts(id),
  traditional_chinese text NOT NULL,
  simplified_chinese text,
  english_translation text NOT NULL
);

CREATE INDEX example_sentences_concept_idx
  ON example_sentences(concept_id);

-- Questions

CREATE TABLE questions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id integer NOT NULL REFERENCES lessons(id),
  concept_id integer,
  question_type text NOT NULL
    CHECK (question_type IN ('RECOGNITION', 'PRONUNCIATION', 'WRITING')),
  order_num integer NOT NULL CHECK (order_num > 0),
  prompt text NOT NULL,
  correct_answer text NOT NULL,
  options jsonb,
  CHECK (options IS NULL OR jsonb_typeof(options) = 'array'),
  UNIQUE (lesson_id, order_num),
  UNIQUE (id, lesson_id),
  FOREIGN KEY (concept_id, lesson_id)
    REFERENCES vocabulary_concepts(id, lesson_id)
);

CREATE INDEX questions_concept_idx ON questions(concept_id);

-- Attempts and Responses

CREATE TABLE lesson_attempts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id integer NOT NULL REFERENCES users(id),
  lesson_id integer NOT NULL REFERENCES lessons(id),
  status text NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  score_percent integer
    CHECK (score_percent BETWEEN 0 AND 100),
  questions_correct integer,
  total_questions integer NOT NULL CHECK (total_questions > 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (
    questions_correct IS NULL
    OR questions_correct BETWEEN 0 AND total_questions
  ),
  CHECK (
    (status = 'IN_PROGRESS' AND completed_at IS NULL)
    OR
    (status = 'COMPLETED' AND completed_at IS NOT NULL)
  ),
  CHECK (completed_at IS NULL OR completed_at >= started_at),
  UNIQUE (id, lesson_id)
);

CREATE INDEX lesson_attempts_student_lesson_idx
  ON lesson_attempts(student_id, lesson_id);

CREATE INDEX lesson_attempts_lesson_idx
  ON lesson_attempts(lesson_id);

CREATE TABLE question_responses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id integer NOT NULL,
  question_id integer NOT NULL,
  lesson_id integer NOT NULL,
  is_correct boolean NOT NULL,
  student_audio_s3_key text,
  student_stroke_data jsonb,
  student_text_answer text,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id),
  FOREIGN KEY (attempt_id, lesson_id)
    REFERENCES lesson_attempts(id, lesson_id),
  FOREIGN KEY (question_id, lesson_id)
    REFERENCES questions(id, lesson_id)
);

CREATE INDEX question_responses_question_idx
  ON question_responses(question_id);

-- Down Migration

DROP TABLE question_responses;
DROP TABLE lesson_attempts;
DROP TABLE questions;
DROP TABLE pronunciations;
DROP TABLE example_sentences;
DROP TABLE chinese_expressions;
DROP TABLE vocabulary_concepts;
DROP TABLE class_lessons;
DROP TABLE lessons;

ALTER TABLE users DROP CONSTRAINT users_student_class_fk;

DROP TABLE classes;
DROP TABLE users;

DROP FUNCTION set_lesson_updated_at();