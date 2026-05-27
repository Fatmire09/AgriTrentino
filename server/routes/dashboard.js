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
    const tutti = await Intervento.find({ appezzamentoId: { $in: ids } });

    // US49: annate disponibili (anni con almeno un intervento), decrescenti
    const annateDisponibili = [...new Set(tutti.map((iv) => new Date(iv.dataOra).getFullYear()))]
      .sort((a, b) => b - a);

    // Annata selezionata: ?anno se valido, altrimenti la più recente disponibile (o l'anno corrente)
    const annoRichiesto = parseInt(req.query.anno, 10);
    const annoSelezionato = annateDisponibili.includes(annoRichiesto)
      ? annoRichiesto
      : (annateDisponibili[0] || new Date().getFullYear());

    // Interventi dell'annata selezionata
    const interventi = tutti.filter((iv) => new Date(iv.dataOra).getFullYear() === annoSelezionato);

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
      haInterventi: tutti.length > 0,
      annoSelezionato,
      annateDisponibili,
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