-- MySQL schema for full-feature quiz app with subjects, chapters, quizzes, concepts and stats
SET sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
SET NAMES utf8mb4;

-- 1. Users
CREATE TABLE user (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.2 Course / Subject
CREATE TABLE course (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  UNIQUE (name)
);

-- 1.3 Chapter
CREATE TABLE chapter (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES course(id),
  UNIQUE (course_id, name)
);

-- 2. Content authoring
CREATE TABLE quiz_set (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  chapter_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  gpt_source_json JSON,
  total_questions SMALLINT UNSIGNED,
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapter(id),
  FOREIGN KEY (created_by) REFERENCES user(id)
);

CREATE TABLE tag (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE quiz_set_tag (
  quiz_set_id BIGINT UNSIGNED,
  tag_id BIGINT UNSIGNED,
  PRIMARY KEY (quiz_set_id, tag_id),
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id)
);

CREATE TABLE question (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_type ENUM('mcq','fill','true_false') NOT NULL,
  stem TEXT NOT NULL,
  solution_text TEXT,
  explanation TEXT,
  difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
  metadata_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_option (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE
);

CREATE TABLE set_question (
  quiz_set_id BIGINT UNSIGNED,
  question_id BIGINT UNSIGNED,
  position SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (quiz_set_id, position),
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question(id)
);

-- 3. Domain concepts
CREATE TABLE concept (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE question_concept (
  question_id BIGINT UNSIGNED,
  concept_id BIGINT UNSIGNED,
  PRIMARY KEY (question_id, concept_id),
  FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE TABLE concept_resource (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  concept_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('url','pdf','video','note') NOT NULL,
  title VARCHAR(255),
  link TEXT,
  FOREIGN KEY (concept_id) REFERENCES concept(id) ON DELETE CASCADE
);

-- 4. Gameplay & telemetry
CREATE TABLE play_session (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  quiz_set_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  score_raw SMALLINT UNSIGNED,
  score_percent DECIMAL(5,2),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id)
);

CREATE TABLE play_event (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  play_session_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('view','answer','next','prev','timeout') NOT NULL,
  event_at DATETIME NOT NULL,
  payload_json JSON,
  FOREIGN KEY (play_session_id) REFERENCES play_session(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question(id)
);

CREATE TABLE answer (
  play_session_id BIGINT UNSIGNED,
  question_id BIGINT UNSIGNED,
  option_id BIGINT UNSIGNED NULL,
  fill_text TEXT,
  is_correct BOOLEAN,
  answered_at DATETIME NOT NULL,
  PRIMARY KEY (play_session_id, question_id),
  FOREIGN KEY (play_session_id) REFERENCES play_session(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question(id),
  FOREIGN KEY (option_id) REFERENCES question_option(id)
);

-- 5. LangChain integration & mastery
CREATE TABLE lc_job (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  play_session_id BIGINT UNSIGNED NOT NULL,
  queued_at DATETIME NOT NULL,
  finished_at DATETIME,
  status ENUM('queued','processing','done','error') DEFAULT 'queued',
  result_json JSON,
  error_text TEXT,
  FOREIGN KEY (play_session_id) REFERENCES play_session(id) ON DELETE CASCADE
);

CREATE TABLE user_concept_score (
  user_id BIGINT UNSIGNED,
  concept_id BIGINT UNSIGNED,
  mastery DECIMAL(4,3),
  last_upd_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, concept_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (concept_id) REFERENCES concept(id)
);

CREATE TABLE user_question_review (
  user_id BIGINT UNSIGNED,
  question_id BIGINT UNSIGNED,
  next_review_at DATETIME NOT NULL,
  easiness DECIMAL(3,2) DEFAULT 2.50,
  interval_days SMALLINT UNSIGNED DEFAULT 1,
  repetitions SMALLINT UNSIGNED DEFAULT 0,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (question_id) REFERENCES question(id)
);

-- 6. Roll-ups & dashboards
CREATE TABLE question_stat (
  question_id BIGINT UNSIGNED PRIMARY KEY,
  total_attempts BIGINT UNSIGNED DEFAULT 0,
  correct_count BIGINT UNSIGNED DEFAULT 0,
  avg_time_ms BIGINT UNSIGNED DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES question(id)
);

CREATE TABLE quiz_set_stat (
  quiz_set_id BIGINT UNSIGNED PRIMARY KEY,
  total_plays BIGINT UNSIGNED DEFAULT 0,
  avg_score_pct DECIMAL(5,2) DEFAULT 0.00,
  avg_duration_s INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id)
);

CREATE TABLE user_progress (
  user_id BIGINT UNSIGNED,
  quiz_set_id BIGINT UNSIGNED,
  best_score_pct DECIMAL(5,2),
  last_played_at DATETIME,
  PRIMARY KEY (user_id, quiz_set_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_set(id)
);

-- 7. Useful indexes
CREATE INDEX idx_answer_question ON answer(question_id);
CREATE INDEX idx_event_session_ts ON play_event(play_session_id, event_at);
CREATE INDEX idx_qc_concept ON question_concept(concept_id);
CREATE INDEX idx_ps_user_chapter ON play_session(user_id, quiz_set_id);
CREATE INDEX idx_ucs_mastery ON user_concept_score(concept_id, mastery);
