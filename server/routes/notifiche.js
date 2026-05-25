const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Notifica = require('../models/Notifica');

// GET /api/v1/notifiche — notifiche dell'utente autenticato (più recenti prima)
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifiche = await Notifica.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    const nonLette = notifiche.filter((n) => !n.letta).length;
    return res.status(200).json({ notifiche, nonLette });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
