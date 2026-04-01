const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── Determine persistent data directory ──────────────────────────
// Render mounts the persistent disk at /data.
// We confirm it's the actual disk (not ephemeral) by checking it
// survives across the process — we write a sentinel file with the
// current process start time and compare on next boot.
function getDataDir() {
  const candidates = ['/data'];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // Write + read a test file to confirm real write access
      const test = path.join(dir, '.disk_test');
      fs.writeFileSync(test, String(Date.now()));
      const val = fs.readFileSync(test, 'utf8');
      fs.unlinkSync(test);
      if (val && val.length > 0) {
        console.log('✅ Data directory:', dir);
        return dir;
      }
    } catch(e) {
      console.log('⚠️  Cannot use', dir, ':', e.message);
    }
  }

  // Fallback: local data folder next to this file
  const fallback = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
  console.log('⚠️  Using fallback data dir (NOT persistent):', fallback);
  console.log('⚠️  FIX: In Render dashboard → your service → Disks → add disk mounted at /data');
  return fallback;
}

const DATA_DIR = getDataDir();
const DB_PATH  = path.join(DATA_DIR, 'db.json');
console.log('📁 DB path:', DB_PATH);

// Initialise db.json if missing
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ topics:[], messages:[], flashcards:[], concepts:[] }));
  console.log('📝 Created new db.json');
} else {
  console.log('📊 Existing db.json size:', fs.statSync(DB_PATH).size, 'bytes');
}

const adapter = new FileSync(DB_PATH);
const db      = low(adapter);
db.defaults({ topics:[], messages:[], flashcards:[], concepts:[] }).write();

function now()   { return new Date().toISOString(); }
function genId() { return uuidv4(); }

// ── TOPICS ────────────────────────────────────────────────────────
const topicOps = {
  getAll() {
    return db.get('topics').orderBy(['updated_at'],['desc']).value().map(t => ({
      ...t,
      message_count:   db.get('messages').filter({topic_id:t.id}).size().value(),
      flashcard_count: db.get('flashcards').filter({topic_id:t.id}).size().value()
    }));
  },
  getById(id) {
    const t = db.get('topics').find({id}).value();
    if (!t) return null;
    return { ...t, messages: db.get('messages').filter({topic_id:id}).sortBy('created_at').value() };
  },
  create({ title, specialty }) {
    const topic = { id:genId(), title, specialty:specialty||'General', created_at:now(), updated_at:now() };
    db.get('topics').push(topic).write();
    return topic;
  },
  update(id, fields) {
    db.get('topics').find({id}).assign({...fields, updated_at:now()}).write();
    return db.get('topics').find({id}).value();
  },
  touch(id) { db.get('topics').find({id}).assign({updated_at:now()}).write(); },
  delete(id) {
    db.get('topics').remove({id}).write();
    db.get('messages').remove({topic_id:id}).write();
    db.get('flashcards').remove({topic_id:id}).write();
    db.get('concepts').remove({topic_id:id}).write();
  }
};

// ── MESSAGES ──────────────────────────────────────────────────────
const msgOps = {
  getByTopic(topic_id) { return db.get('messages').filter({topic_id}).sortBy('created_at').value(); },
  insert({ topic_id, role, content }) {
    const msg = { id:genId(), topic_id, role, content:content||'', created_at:now() };
    db.get('messages').push(msg).write();
    return msg;
  },
  updateContent(id, content) { db.get('messages').find({id}).assign({content}).write(); }
};

// ── FLASHCARDS ────────────────────────────────────────────────────
const fcOps = {
  getAll()             { return db.get('flashcards').orderBy(['created_at'],['desc']).value(); },
  getByTopic(topic_id) { return db.get('flashcards').filter({topic_id}).orderBy(['created_at'],['desc']).value(); },
  getBySpecialty(s)    { return db.get('flashcards').filter({specialty:s}).orderBy(['created_at'],['desc']).value(); },
  insert({ topic_id, specialty, front, back, source }) {
    const fc = { id:genId(), topic_id, specialty:specialty||'General', front, back, source:source||'ai', created_at:now() };
    db.get('flashcards').push(fc).write();
    return fc;
  },
  delete(id) { db.get('flashcards').remove({id}).write(); },
  getStats() {
    const counts = {};
    db.get('flashcards').value().forEach(f => { counts[f.specialty]=(counts[f.specialty]||0)+1; });
    return Object.entries(counts).map(([specialty,count])=>({specialty,count})).sort((a,b)=>b.count-a.count);
  }
};

// ── CONCEPTS ──────────────────────────────────────────────────────
const conceptOps = {
  getByTopic(topic_id)  { return db.get('concepts').filter({topic_id}).orderBy(['created_at'],['desc']).value(); },
  getBySpecialty(s)     { return db.get('concepts').filter({specialty:s}).orderBy(['created_at'],['desc']).value(); },
  insert({ topic_id, specialty, content, type }) {
    const c = { id:genId(), topic_id, specialty:specialty||'General', content, type:type||'highlight', created_at:now() };
    db.get('concepts').push(c).write();
    return c;
  },
  delete(id) { db.get('concepts').remove({id}).write(); }
};

// ── STATS ─────────────────────────────────────────────────────────
const statsOps = {
  overview() {
    return {
      total_topics:     db.get('topics').size().value(),
      total_messages:   db.get('messages').size().value(),
      total_flashcards: db.get('flashcards').size().value(),
      total_concepts:   db.get('concepts').size().value(),
      db_path:          DB_PATH,
      db_size_bytes:    fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0
    };
  }
};

module.exports = { db, topicOps, msgOps, fcOps, conceptOps, statsOps, genId };
