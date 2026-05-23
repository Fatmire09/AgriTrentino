const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const BilancioIdricoGiornaliero = require('../models/BilancioIdricoGiornaliero');
const bilancioIdricoService = require('../services/bilancioIdricoService');

// Helper riusato (stessa logica di trovaCampoAutorizzato in meteo.js)
async function trovaCampoAutorizzato(req, res) {
  const field = await Field.findById(req.params.fieldId);
  if (!field) {
    res.status(404).json({ error: 'Appezzamento non trovato' });
    return null;
  }
  if (field.ownerId.toString() !== req.userId) {
    res.status(403).json({ error: 'Non autorizzato' });
    return null;
  }
  return field;
}

// GET /api/v1/fields/:fieldId/bilancio-idrico
// Restituisce il bilancio idrico più recente + storico ultimi N giorni
router.get('/', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    // Validazione param giorni
    const GIORNI_DEFAULT = 30;
    const GIORNI_MAX = 365;
    let giorni = parseInt(req.query.giorni, 10);
    if (isNaN(giorni) || giorni < 1) giorni = GIORNI_DEFAULT;
    if (giorni > GIORNI_MAX) giorni = GIORNI_MAX;

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - giorni);

    // Bilancio più recente
    const corrente = await BilancioIdricoGiornaliero.findOne({ appezzamentoId: field._id })
      .sort({ data: -1 });

    if (!corrente) {
      return res.status(200).json({
        corrente: null,
        storico: [],
        message: 'Bilancio idrico non ancora disponibile. Assicurati che il campo abbia una coltura con fase fenologica impostata e che siano stati raccolti dati meteo per almeno 24 ore.',
      });
    }

    // Storico ordinato dal più recente
    const storico = await BilancioIdricoGiornaliero.find({
      appezzamentoId: field._id,
      data: { $gte: limite },
    })
      .sort({ data: -1 })
      .select('data bilancio riservaIdricaMm umiditaSuoloPerc precipitazioniMm evapotraspirazioneMm');

    return res.status(200).json({ corrente, storico });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
