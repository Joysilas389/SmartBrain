const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'smartmedicine.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS topics (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    specialty   TEXT NOT NULL DEFAULT 'General',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id    TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content     TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id          TEXT PRIMARY KEY,
    topic_id    TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    specialty   TEXT NOT NULL DEFAULT 'General',
    front       TEXT NOT NULL,
    back        TEXT NOT NULL,
    source      TEXT NOT NULL DEFAULT 'ai',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS concepts (
    id          TEXT PRIMARY KEY,
    topic_id    TEXT REFERENCES topics(id) ON DELETE SET NULL,
    specialty   TEXT NOT NULL DEFAULT 'General',
    content     TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'highlight',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_messages_topic   ON messages(topic_id);
  CREATE INDEX IF NOT EXISTS idx_flashcards_topic ON flashcards(topic_id);
  CREATE INDEX IF NOT EXISTS idx_flashcards_spec  ON flashcards(specialty);
  CREATE INDEX IF NOT EXISTS idx_concepts_topic   ON concepts(topic_id);
  CREATE INDEX IF NOT EXISTS idx_concepts_spec    ON concepts(specialty);
`);

// ── Topic operations ─────────────────────────────────
const topicOps = {
  getAll: db.prepare(`
    SELECT t.*,
      COUNT(DISTINCT m.id) as message_count,
      COUNT(DISTINCT f.id) as flashcard_count
    FROM topics t
    LEFT JOIN messages m ON m.topic_id = t.id
    LEFT JOIN flashcards f ON f.topic_id = t.id
    GROUP BY t.id
    ORDER BY t.updated_at DESC
  `),

  getById: db.prepare(`SELECT * FROM topics WHERE id = ?`),

  create: db.prepare(`
    INSERT INTO topics(id, title, specialty, created_at, updated_at)
    VALUES(@id, @title, @specialty, datetime('now'), datetime('now'))
  `),

  update: db.prepare(`
    UPDATE topics SET title=@title, specialty=@specialty, updated_at=datetime('now')
    WHERE id=@id
  `),

  touch: db.prepare(`UPDATE topics SET updated_at=datetime('now') WHERE id=?`),

  delete: db.prepare(`DELETE FROM topics WHERE id=?`),

  rename: db.prepare(`UPDATE topics SET title=@title, updated_at=datetime('now') WHERE id=@id`),

  setSpecialty: db.prepare(`UPDATE topics SET specialty=@specialty, updated_at=datetime('now') WHERE id=@id`),
};

// ── Message operations ────────────────────────────────
const msgOps = {
  getByTopic: db.prepare(`SELECT * FROM messages WHERE topic_id=? ORDER BY id ASC`),

  insert: db.prepare(`
    INSERT INTO messages(topic_id, role, content, created_at)
    VALUES(@topic_id, @role, @content, datetime('now'))
    RETURNING id
  `),

  updateContent: db.prepare(`UPDATE messages SET content=? WHERE id=?`),

  getLastAssistant: db.prepare(`
    SELECT * FROM messages WHERE topic_id=? AND role='assistant' ORDER BY id DESC LIMIT 1
  `),
};

// ── Flashcard operations ──────────────────────────────
const fcOps = {
  getAll: db.prepare(`SELECT * FROM flashcards ORDER BY created_at DESC`),

  getByTopic: db.prepare(`SELECT * FROM flashcards WHERE topic_id=? ORDER BY created_at DESC`),

  getBySpecialty: db.prepare(`SELECT * FROM flashcards WHERE specialty=? ORDER BY created_at DESC`),

  insert: db.prepare(`
    INSERT INTO flashcards(id, topic_id, specialty, front, back, source, created_at)
    VALUES(@id, @topic_id, @specialty, @front, @back, @source, datetime('now'))
  `),

  delete: db.prepare(`DELETE FROM flashcards WHERE id=?`),

  getStats: db.prepare(`
    SELECT specialty, COUNT(*) as count FROM flashcards GROUP BY specialty ORDER BY count DESC
  `),
};

// ── Concept/Highlight operations ──────────────────────
const conceptOps = {
  getByTopic: db.prepare(`SELECT * FROM concepts WHERE topic_id=? ORDER BY created_at DESC`),

  getBySpecialty: db.prepare(`SELECT * FROM concepts WHERE specialty=? ORDER BY created_at DESC`),

  insert: db.prepare(`
    INSERT INTO concepts(id, topic_id, specialty, content, type, created_at)
    VALUES(@id, @topic_id, @specialty, @content, @type, datetime('now'))
  `),

  delete: db.prepare(`DELETE FROM concepts WHERE id=?`),
};

// ── Stats ─────────────────────────────────────────────
const statsOps = {
  overview: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM topics)    as total_topics,
      (SELECT COUNT(*) FROM messages)  as total_messages,
      (SELECT COUNT(*) FROM flashcards) as total_flashcards,
      (SELECT COUNT(*) FROM concepts)  as total_concepts
  `),
  bySpecialty: db.prepare(`
    SELECT specialty,
      COUNT(DISTINCT t.id) as topics,
      COUNT(DISTINCT f.id) as flashcards
    FROM topics t
    LEFT JOIN flashcards f ON f.specialty = t.specialty
    GROUP BY t.specialty
    ORDER BY topics DESC
  `),
};

module.exports = { db, topicOps, msgOps, fcOps, conceptOps, statsOps };
