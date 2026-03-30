const express = require('express');
const router  = express.Router();
const { conceptOps } = require('../db/database');

router.get('/topic/:topicId', (req, res) => {
  try { res.json(conceptOps.getByTopic(req.params.topicId)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/specialty/:specialty', (req, res) => {
  try { res.json(conceptOps.getBySpecialty(req.params.specialty)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { topic_id, specialty = 'General', content, type = 'highlight' } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const c = conceptOps.insert({ topic_id, specialty, content, type });
    res.json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try { conceptOps.delete(req.params.id); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
