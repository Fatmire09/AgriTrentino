const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Coltura = require('../models/Coltura');
const rischioFitosanitarioService = require('../services/rischioFitosanitarioService');

// Helper: trova il campo e verifica che appartenga all'utente autenticato
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

// GET /api/v1/fields/:fieldId/indici/fitosanitario
// Indice di rischio fitosanitario (peronospora) calcolato on-demand sulle ultime 48h
router.get('/fitosanitario', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    // Coltura corrente del campo (la più recente)
    const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });
    if (!coltura) {
      return res.status(200).json({
        fitosanitario: null,
        message: 'Nessuna coltura associata a questo appezzamento',
      });
    }

    const indice = await rischioFitosanitarioService.calcolaRischioFitosanitario(coltura);
    if (!indice) {
      return res.status(200).json({
        fitosanitario: null,
        message: 'Indice non calcolabile: la coltura non ha una fase fenologica impostata oppure mancano dati meteo nelle ultime 48h',
      });
    }

    return res.status(200).json({
      fitosanitario: { ...indice, ultimoCalcolo: new Date() },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;