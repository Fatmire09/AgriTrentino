const express = require('express');
const router = express.Router();
const Field = require('../models/Field');
const requireAuth = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const fields = await Field.find({ ownerId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ fields });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { nome, latitudine, longitudine, superficie, pendenza, coltura, esposizione } = req.body;

  if (!nome || latitudine === undefined || longitudine === undefined || superficie === undefined) {
    return res.status(400).json({
      error: 'Nome, latitudine, longitudine e superficie sono obbligatori',
    });
  }

  try {
    const field = new Field({
      nome,
      latitudine,
      longitudine,
      superficie,
      pendenza,
      coltura,
      esposizione,
      ownerId: req.userId,
    });
    await field.save();

    return res.status(201).json({
      message: 'Appezzamento creato con successo',
      field,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const firstError = Object.values(err.errors)[0];
      return res.status(400).json({ error: firstError.message });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// US18: GET /api/v1/fields/:id — dettaglio singolo appezzamento
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({ error: 'Appezzamento non trovato' });
    }

    // Solo il proprietario può vedere il proprio appezzamento
    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    return res.status(200).json({ field });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;