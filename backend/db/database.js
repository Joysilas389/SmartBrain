const low    = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

// Use /data (Render persistent disk) if available, else local data dir
var DATA_DIR;
try {
  // Test if /data is writable (Render persistent disk)
  fs.accessSync('/data', fs.constants.W_OK);
  DATA_DIR = '/data';
  console.log('Using persistent disk at /data');
} catch(e) {
  DATA_DIR = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Using local data dir:', DATA_DIR);
}

const adapter = new FileSync(path.join(DATA_DIR, 'db.json'));
const db = low(adapter);

// Default schema
db.defaults({
  topics:     [],
  messages:   [],
  flashcards: [],
  concepts:   []
}).write();

// ── helpers ──────────────────────────────────────────
function now() { return new Date().toISOString(); }
function genId() { return uuidv4(); }

// ── TOPICS ────────────────────────────────────────────
const topicOps = {
  getAll() {
    const topics = db.get('topics').orderBy(['updated_at'], ['desc']).value();
    return topics.map(t => ({
      ...t,
      message_count:   db.get('messages').filter({topic_id: t.id}).size().value(),
      flashcard_count: db.get('flashcards').filter({topic_id: t.id}).size().value()
    }));
  },
  getById(id) {
    return db.get('topics').find({ id }).value() || null;
  },
  create({ title, specialty }) {
    const topic = { id: genId(), title, specialty: specialty || 'General', created_at: now(), updated_at: now() };
    db.get('topics').push(topic).write();
    return topic;
  },
  update(id, fields) {
    db.get('topics').find({ id }).assign({ ...fields, updated_at: now() }).write();
    return this.getById(id);
  },
  touch(id) {
    db.get('topics').find({ id }).assign({ updated_at: now() }).write();
  },
  delete(id) {
    db.get('topics').remove({ id }).write();
    db.get('messages').remove({ topic_id: id }).write();
    db.get('flashcards').remove({ topic_id: id }).write();
    db.get('concepts').remove({ topic_id: id }).write();
  }
};

// ── MESSAGES ──────────────────────────────────────────
const msgOps = {
  getByTopic(topic_id) {
    return db.get('messages').filter({ topic_id }).sortBy('created_at').value();
  },
  insert({ topic_id, role, content }) {
    const msg = { id: genId(), topic_id, role, content: content || '', created_at: now() };
    db.get('messages').push(msg).write();
    return msg;
  },
  updateContent(id, content) {
    db.get('messages').find({ id }).assign({ content }).write();
  }
};

// ── FLASHCARDS ────────────────────────────────────────
const fcOps = {
  getAll() {
    return db.get('flashcards').orderBy(['created_at'], ['desc']).value();
  },
  getByTopic(topic_id) {
    return db.get('flashcards').filter({ topic_id }).orderBy(['created_at'], ['desc']).value();
  },
  getBySpecialty(specialty) {
    return db.get('flashcards').filter({ specialty }).orderBy(['created_at'], ['desc']).value();
  },
  insert({ topic_id, specialty, front, back, source }) {
    const fc = { id: genId(), topic_id, specialty: specialty || 'General', front, back, source: source || 'ai', created_at: now() };
    db.get('flashcards').push(fc).write();
    return fc;
  },
  delete(id) {
    db.get('flashcards').remove({ id }).write();
  },
  getStats() {
    const fcs = db.get('flashcards').value();
    const counts = {};
    fcs.forEach(f => { counts[f.specialty] = (counts[f.specialty] || 0) + 1; });
    return Object.entries(counts).map(([specialty, count]) => ({ specialty, count })).sort((a,b) => b.count - a.count);
  }
};

// ── CONCEPTS ──────────────────────────────────────────
const conceptOps = {
  getByTopic(topic_id) {
    return db.get('concepts').filter({ topic_id }).orderBy(['created_at'], ['desc']).value();
  },
  getBySpecialty(specialty) {
    return db.get('concepts').filter({ specialty }).orderBy(['created_at'], ['desc']).value();
  },
  insert({ topic_id, specialty, content, type }) {
    const c = { id: genId(), topic_id, specialty: specialty || 'General', content, type: type || 'highlight', created_at: now() };
    db.get('concepts').push(c).write();
    return c;
  },
  delete(id) {
    db.get('concepts').remove({ id }).write();
  }
};

// ── STATS ──────────────────────────────────────────────
const statsOps = {
  overview() {
    return {
      total_topics:     db.get('topics').size().value(),
      total_messages:   db.get('messages').size().value(),
      total_flashcards: db.get('flashcards').size().value(),
      total_concepts:   db.get('concepts').size().value()
    };
  }
};

module.exports = { db, topicOps, msgOps, fcOps, conceptOps, statsOps, genId };
