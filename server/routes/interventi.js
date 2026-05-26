const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');
const { classificaIntervento } = require('../services/classificazioneInterventoService');

// Helper auth+ownership
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

// POST /api/v1/fields/:fieldId/interventi
router.post('/', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    const intervento = new Intervento({
      ...req.body,
      appezzamentoId: field._id,
    });
    await intervento.save();

    // US43: feedback immediato sulla classificazione
    const { classificazione, livello } = await classificaIntervento(intervento);

    return res.status(201).json({
      message: 'Intervento registrato con successo',
      intervento: { ...intervento.toObject(), classificazione, livello },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    if (err.name === 'ValidationError' || err.message) {
      const msg = err.message?.replace('Intervento validation failed: ', '') || 'Validazione fallita';
      return res.status(400).json({ error: `Validazione fallita: ${msg}` });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// US42: GET /api/v1/fields/:fieldId/interventi — lista interventi del campo
router.get('/', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

        // US44: filtri opzionali per tipologia e periodo (ultimi N giorni)
    const filtro = { appezzamentoId: field._id };
    if (['trattamento', 'irrigazione'].includes(req.query.tipologia)) {
      filtro.tipologia = req.query.tipologia;
    }
    const giorni = parseInt(req.query.giorni, 10);
    if (!isNaN(giorni) && giorni > 0) {
      const dal = new Date();
      dal.setDate(dal.getDate() - giorni);
      filtro.dataOra = { $gte: dal };
    }

    const interventi = await Intervento.find(filtro)
      .sort({ dataOra: -1 })
      .limit(50)
      .lean();

    // US43: classifica ogni intervento in base al rischio della sua data
    const interventiClassificati = [];
    for (const intervento of interventi) {
      const { classificazione, livello } = await classificaIntervento(intervento);
      interventiClassificati.push({ ...intervento, classificazione, livello });
    }

    return res.json({ interventi: interventiClassificati });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

});

// US45: PATCH /api/v1/fields/:fieldId/interventi/:interventoId — modifica intervento
router.patch('/:interventoId', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    const intervento = await Intervento.findOne({
      _id: req.params.interventoId,
      appezzamentoId: field._id,
    });
    if (!intervento) {
      return res.status(404).json({ error: 'Intervento non trovato' });
    }

    // Campi modificabili (tipologia e appezzamentoId restano fissi)
    const modificabili = ['dataOra', 'note', 'principioAttivo', 'quantita', 'unitaMisura', 'volumeAcqua'];
    for (const campo of modificabili) {
      if (req.body[campo] !== undefined) intervento[campo] = req.body[campo];
    }
    await intervento.save(); // riesegue la validazione condizionale del modello

    const { classificazione, livello } = await classificaIntervento(intervento);

    return res.status(200).json({
      message: 'Intervento aggiornato con successo',
      intervento: { ...intervento.toObject(), classificazione, livello },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    if (err.name === 'ValidationError' || err.message) {
      const msg = err.message?.replace('Intervento validation failed: ', '') || 'Validazione fallita';
      return res.status(400).json({ error: `Validazione fallita: ${msg}` });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;