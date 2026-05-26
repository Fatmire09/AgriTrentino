const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');

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

    return res.status(201).json({
      message: 'Intervento registrato con successo',
      intervento,
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

    const interventi = await Intervento.find({ appezzamentoId: field._id })
      .sort({ dataOra: -1 })
      .limit(50)
      .lean();

    return res.json({ interventi });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;