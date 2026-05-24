const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Coltura = require('../models/Coltura');
const avanzamentoFenologicoService = require('../services/avanzamentoFenologicoService');

// Helper riusato
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

// GET /api/v1/fields/:fieldId/fenologia
// Restituisce lo stato fenologico corrente calcolato (GDD + soglia + % progresso)
router.get('/', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    // Trova la coltura corrente del campo (la più recente)
    const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });

    if (!coltura) {
      return res.status(200).json({
        fenologia: null,
        message: 'Nessuna coltura associata a questo appezzamento',
      });
    }

    const stato = await avanzamentoFenologicoService.calcolaStatoFenologico(coltura);

    if (!stato) {
      return res.status(200).json({
        fenologia: null,
        message: 'La coltura non ha una fase fenologica impostata',
      });
    }

    return res.status(200).json({
      fenologia: {
        ...stato,
        ultimoCalcolo: new Date(),
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
