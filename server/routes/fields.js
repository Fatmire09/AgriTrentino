const express = require('express');
const router = express.Router();
const Field = require('../models/Field');
const requireAuth = require('../middleware/auth');
const meteoService = require('../services/meteoService');
const cancellazioneService = require('../services/cancellazioneService');

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

    // US25: avvia in background il fetch meteo iniziale (non blocca la risposta al client)
    meteoService.aggiornaMeteoCampo(field)
      .then((risultato) => {
        console.log(`[meteo auto-trigger] campo ${field._id}: ${risultato.datiSalvati} dati salvati da ${risultato.stazione.code}`);
      })
      .catch((err) => {
        console.error(`[meteo auto-trigger] campo ${field._id}: errore`, err.message);
      });

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

// US19: PATCH /api/v1/fields/:id — modifica appezzamento esistente
router.patch('/:id', requireAuth, async (req, res) => {
  const { nome, latitudine, longitudine, superficie, pendenza, coltura, esposizione } = req.body;
  const updates = {};

  if (nome !== undefined) {
    if (!nome.trim()) return res.status(400).json({ error: 'Il nome non può essere vuoto' });
    updates.nome = nome.trim();
  }
  if (latitudine !== undefined) updates.latitudine = latitudine;
  if (longitudine !== undefined) updates.longitudine = longitudine;
  if (superficie !== undefined) updates.superficie = superficie;
  if (pendenza !== undefined) updates.pendenza = pendenza;
  if (coltura !== undefined) updates.coltura = coltura;
  if (esposizione !== undefined) updates.esposizione = esposizione;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nessun campo da aggiornare' });
  }

  try {
    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ error: 'Appezzamento non trovato' });
    }
    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Applica gli aggiornamenti e salva (fa scattare le validazioni Mongoose)
    Object.assign(field, updates);
    await field.save();

    return res.status(200).json({
      message: 'Appezzamento aggiornato con successo',
      field,
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

// US20: DELETE /api/v1/fields/:id — elimina appezzamento
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field) {
      return res.status(404).json({ error: 'Appezzamento non trovato' });
    }

    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // US63 (GDPR): elimina a cascata tutti i dati associati al campo
    await cancellazioneService.eliminaDatiCampo(field._id);
    await Field.deleteOne({ _id: field._id });

    return res.status(200).json({ message: 'Appezzamento eliminato con successo' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;