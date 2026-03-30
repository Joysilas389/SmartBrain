const express = require('express');
const router  = express.Router();
const { fcOps } = require('../db/database');

router.get('/', (req, res) => {
  try {
    const { specialty } = req.query;
    const cards = specialty && specialty !== 'All'
      ? fcOps.getBySpecialty(specialty)
      : fcOps.getAll();
    res.json(cards);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/topic/:topicId', (req, res) => {
  try { res.json(fcOps.getByTopic(req.params.topicId)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { topic_id, specialty = 'General', front, back, source = 'manual' } = req.body;
    if (!front || !back) return res.status(400).json({ error: 'front and back required' });
    const fc = fcOps.insert({ topic_id, specialty, front, back, source });
    res.json(fc);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try { fcOps.delete(req.params.id); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats/by-specialty', (req, res) => {
  try { res.json(fcOps.getStats()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
