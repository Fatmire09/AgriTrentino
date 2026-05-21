const express = require('express');
const router = express.Router({ mergeParams: true }); // serve per leggere :fieldId
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Coltura = require('../models/Coltura');

// US21: GET /api/v1/fields/:fieldId/colture
// Lista delle colture dell'appezzamento, dalla più recente
router.get('/', requireAuth, async (req, res) => {
  try {
    const field = await Field.findById(req.params.fieldId);

    if (!field) {
      return res.status(404).json({ error: 'Appezzamento non trovato' });
    }
    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const colture = await Coltura.find({ appezzamentoId: field._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ colture });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// US21: POST /api/v1/fields/:fieldId/colture
// Aggiunge una nuova coltura all'appezzamento (diventa la corrente)
router.post('/', requireAuth, async (req, res) => {
  const { tipologia, varieta, fase } = req.body;

  if (!tipologia) {
    return res.status(400).json({ error: 'La tipologia della coltura è obbligatoria' });
  }

  try {
    const field = await Field.findById(req.params.fieldId);

    if (!field) {
      return res.status(404).json({ error: 'Appezzamento non trovato' });
    }
    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const coltura = new Coltura({
      appezzamentoId: field._id,
      tipologia,
      varieta: varieta || null,
      fase: fase || null,
      dataAggiornamento: new Date(),
    });
    await coltura.save();

    return res.status(201).json({
      message: 'Coltura aggiunta con successo',
      coltura,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    if (err.name === 'ValidationError') {
      const messaggio = Object.values(err.errors)[0].message;
      return res.status(400).json({ error: `Validazione fallita: ${messaggio}` });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// US24: PATCH /api/v1/fields/:fieldId/colture/:colturaId
// Aggiorna manualmente la fase fenologica di una coltura esistente
router.patch('/:colturaId', requireAuth, async (req, res) => {
  const { fase } = req.body;

  if (fase === undefined || fase === null || fase === '') {
    return res.status(400).json({ error: 'La fase fenologica è obbligatoria' });
  }

  try {
    // Recupera prima il campo padre per verificare l'ownerId
    const field = await Field.findById(req.params.fieldId);
    if (!field) {
      return res.status(404).json({ error: 'Appezzamento non trovato' });
    }
    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Recupera la coltura e verifica che appartenga al campo
    const coltura = await Coltura.findById(req.params.colturaId);
    if (!coltura || coltura.appezzamentoId.toString() !== field._id.toString()) {
      return res.status(404).json({ error: 'Coltura non trovata' });
    }

    // Aggiorna la fase + dataAggiornamento, poi salva (fa scattare il validatore)
    coltura.fase = fase;
    coltura.dataAggiornamento = new Date();
    await coltura.save();

    return res.status(200).json({
      message: 'Fase fenologica aggiornata con successo',
      coltura,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    if (err.name === 'ValidationError') {
      const messaggio = Object.values(err.errors)[0].message;
      return res.status(400).json({ error: `Validazione fallita: ${messaggio}` });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;