const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');

// GET /api/v1/dashboard/sostenibilita — sintesi sostenibilità dell'utente (tutti i suoi campi)
router.get('/sostenibilita', requireAuth, async (req, res) => {
  try {
    const campi = await Field.find({ ownerId: req.userId }).select('_id');
    const ids = campi.map((c) => c._id);
    const interventiTotali = await Intervento.countDocuments({ appezzamentoId: { $in: ids } });

    return res.status(200).json({
      haInterventi: interventiTotali > 0,
      interventiTotali,
      // US48+: qui arriveranno % interventi giustificati, risparmio idrico/chimico, trend, ecc.
    });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;