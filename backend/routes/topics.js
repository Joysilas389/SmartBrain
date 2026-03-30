const express = require('express');
const router  = express.Router();
const { topicOps, msgOps } = require('../db/database');
const { classifySpecialty }  = require('../utils');

router.get('/', (req, res) => {
  try { res.json(topicOps.getAll()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const topic = topicOps.getById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Not found' });
    const messages = msgOps.getByTopic(req.params.id);
    res.json({ ...topic, messages });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { title = 'New Session', specialty = 'General' } = req.body;
    const topic = topicOps.create({ title, specialty });
    res.json(topic);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', (req, res) => {
  try {
    const topic = topicOps.getById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Not found' });
    const { title, specialty } = req.body;
    const updated = topicOps.update(req.params.id, {
      title:    title    ?? topic.title,
      specialty: specialty ?? topic.specialty
    });
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try { topicOps.delete(req.params.id); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
