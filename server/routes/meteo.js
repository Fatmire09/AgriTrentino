const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const DatiMeteo = require('../models/DatiMeteo');
const meteoService = require('../services/meteoService');

// ────────────────────────────────────────────────────────────────────────────────
// ROUTE METEO — US25
//
// Tutti gli endpoint richiedono autenticazione e accesso solo al proprio appezzamento.
// Path: /api/v1/fields/:fieldId/meteo/*
// ────────────────────────────────────────────────────────────────────────────────

// Helper: recupera il Field padre e verifica auth + ownership
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

// GET /latest — ultima rilevazione meteo per il campo
router.get('/latest', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    const dato = await DatiMeteo.findOne({ appezzamentoId: field._id })
      .sort({ timestamp: -1 });

    if (!dato) {
      return res.status(200).json({
        dato: null,
        message: 'Nessun dato meteo disponibile per questo appezzamento',
      });
    }
    return res.status(200).json({ dato });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /storico — ultime 48 ore di rilevazioni
router.get('/storico', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    const limite = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const dati = await DatiMeteo.find({
      appezzamentoId: field._id,
      timestamp: { $gte: limite },
    }).sort({ timestamp: -1 });

    return res.status(200).json({ dati });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /refresh — forza l'aggiornamento dei dati meteo
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    const risultato = await meteoService.aggiornaMeteoCampo(field);

    return res.status(200).json({
      message: 'Dati meteo aggiornati con successo',
      stazione: risultato.stazione,
      datiSalvati: risultato.datiSalvati,
      datoCorrente: risultato.datoCorrente,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    if (err.message?.includes('Impossibile contattare') || err.message?.includes('non disponibili')) {
      return res.status(503).json({ error: 'Servizio meteo non disponibile, riprova più tardi' });
    }
    console.error('[meteo refresh] errore:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /oggi — sintesi meteo della giornata corrente (US26)
router.get('/oggi', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    // Inizio del giorno locale (00:00)
    const inizioGiorno = new Date();
    inizioGiorno.setHours(0, 0, 0, 0);

    const risultato = await DatiMeteo.aggregate([
      {
        $match: {
          appezzamentoId: field._id,
          timestamp: { $gte: inizioGiorno },
        },
      },
      {
        $group: {
          _id: null,
          stazione: { $first: '$stazioneCode' },
          numeroRilevazioni: { $sum: 1 },
          temperaturaMinC: { $min: '$temperaturaC' },
          temperaturaMaxC: { $max: '$temperaturaC' },
          temperaturaMediaC: { $avg: '$temperaturaC' },
          umiditaMediaPerc: { $avg: '$umiditaPerc' },
          precipitazioniTotaliMm: { $sum: '$precipitazioniMm' },
        },
      },
    ]);

    if (risultato.length === 0) {
      return res.status(200).json({
        sintesi: null,
        message: 'Nessuna rilevazione disponibile per oggi',
      });
    }

    const r = risultato[0];
    return res.status(200).json({
      sintesi: {
        data: inizioGiorno.toISOString().split('T')[0],
        stazione: r.stazione,
        numeroRilevazioni: r.numeroRilevazioni,
        temperaturaMinC: r.temperaturaMinC !== null ? Number(r.temperaturaMinC.toFixed(1)) : null,
        temperaturaMaxC: r.temperaturaMaxC !== null ? Number(r.temperaturaMaxC.toFixed(1)) : null,
        temperaturaMediaC: r.temperaturaMediaC !== null ? Number(r.temperaturaMediaC.toFixed(1)) : null,
        umiditaMediaPerc: r.umiditaMediaPerc !== null ? Math.round(r.umiditaMediaPerc) : null,
        precipitazioniTotaliMm: r.precipitazioniTotaliMm !== null ? Number(r.precipitazioniTotaliMm.toFixed(1)) : null,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;