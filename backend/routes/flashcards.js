const express = require('express');
const router = express.Router();
const { fcOps, topicOps } = require('../db/database');
const { nanoid } = require('../utils');

// GET all flashcards (optionally filtered by specialty)
router.get('/', (req, res) => {
  try {
    const { specialty } = req.query;
    const cards = specialty && specialty !== 'All'
      ? fcOps.getBySpecialty.all(specialty)
      : fcOps.getAll.all();
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET flashcards for a topic
router.get('/topic/:topicId', (req, res) => {
  try {
    res.json(fcOps.getByTopic.all(req.params.topicId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create flashcard
router.post('/', (req, res) => {
  try {
    const { topic_id, specialty = 'General', front, back, source = 'manual' } = req.body;
    if (!front || !back) return res.status(400).json({ error: 'front and back required' });
    const id = nanoid();
    fcOps.insert.run({ id, topic_id: topic_id || null, specialty, front, back, source });
    res.json({ id, topic_id, specialty, front, back, source });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE flashcard
router.delete('/:id', (req, res) => {
  try {
    fcOps.delete.run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET stats
router.get('/stats/by-specialty', (req, res) => {
  try {
    res.json(fcOps.getStats.all());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
