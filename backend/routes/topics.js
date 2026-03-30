const express = require('express');
const router = express.Router();
const { topicOps, msgOps } = require('../db/database');
const { nanoid } = require('../utils');

// GET all topics
router.get('/', (req, res) => {
  try {
    const topics = topicOps.getAll.all();
    res.json(topics);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET topic with messages
router.get('/:id', (req, res) => {
  try {
    const topic = topicOps.getById.get(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Not found' });
    const messages = msgOps.getByTopic.all(req.params.id);
    res.json({ ...topic, messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create topic
router.post('/', (req, res) => {
  try {
    const { title = 'New Session', specialty = 'General' } = req.body;
    const id = nanoid();
    topicOps.create.run({ id, title, specialty });
    res.json(topicOps.getById.get(id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH update topic
router.patch('/:id', (req, res) => {
  try {
    const topic = topicOps.getById.get(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Not found' });
    const { title, specialty } = req.body;
    topicOps.update.run({
      id: req.params.id,
      title: title ?? topic.title,
      specialty: specialty ?? topic.specialty
    });
    res.json(topicOps.getById.get(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE topic
router.delete('/:id', (req, res) => {
  try {
    topicOps.delete.run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
