const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Notifica = require('../models/Notifica');

// GET /api/v1/notifiche — notifiche dell'utente autenticato (più recenti prima)
router.get('/', requireAuth, async (req, res) => {
  try {
    // ?limit opzionale (default 50, max 100) per il centro notifiche
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const [notifiche, nonLette] = await Promise.all([
      Notifica.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-userId -__v'),
      // conteggio corretto: TUTTE le non lette, non solo quelle nella pagina corrente
      Notifica.countDocuments({ userId: req.userId, letta: false }),
    ]);
    return res.status(200).json({ notifiche, nonLette });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
