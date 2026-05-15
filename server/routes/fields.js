const express = require('express');
const router = express.Router();
const Field = require('../models/Field');
const requireAuth = require('../middleware/auth');

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

module.exports = router;