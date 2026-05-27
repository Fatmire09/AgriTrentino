const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');
const { classificaIntervento } = require('../services/classificazioneInterventoService');

// GET /api/v1/dashboard/sostenibilita — sintesi sostenibilità dell'utente (tutti i suoi campi)
router.get('/sostenibilita', requireAuth, async (req, res) => {
  try {
    const campi = await Field.find({ ownerId: req.userId }).select('_id');
    const ids = campi.map((c) => c._id);
    const interventi = await Intervento.find({ appezzamentoId: { $in: ids } });

    // US48: classifica ogni intervento e calcola la % di giustificati
    let giustificati = 0;
    let superflui = 0;
    let nonValutabili = 0;
    for (const iv of interventi) {
      const { classificazione } = await classificaIntervento(iv);
      if (classificazione === 'Giustificato') giustificati++;
      else if (classificazione === 'Superfluo') superflui++;
      else nonValutabili++;
    }
    const classificabili = giustificati + superflui;
    const percentualeGiustificati = classificabili > 0
      ? Math.round((giustificati / classificabili) * 100)
      : null;

    return res.status(200).json({
      haInterventi: interventi.length > 0,
      interventiTotali: interventi.length,
      giustificati,
      superflui,
      nonValutabili,
      classificabili,
      percentualeGiustificati,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;