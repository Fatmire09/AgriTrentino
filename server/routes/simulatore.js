const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Coltura = require('../models/Coltura');
const DatiMeteo = require('../models/DatiMeteo');
const rischioFitosanitarioService = require('../services/rischioFitosanitarioService');
const rischioClimaticoService = require('../services/rischioClimaticoService');
const simulatoreService = require('../services/simulatoreService');

// Helper: trova il campo e verifica auth + ownership
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

// US55: GET /api/v1/fields/:fieldId/simulatore/stato-iniziale
// Restituisce i valori meteo reali correnti + fase fenologica + indici di rischio,
// usati come punto di partenza dal simulatore meteo (US55-59).
router.get('/stato-iniziale', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    // Meteo reale: aggregazione delle ultime 24h
    const limite = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const aggreg = await DatiMeteo.aggregate([
      { $match: { appezzamentoId: field._id, timestamp: { $gte: limite } } },
      {
        $group: {
          _id: null,
          tMin: { $min: '$temperaturaC' },
          tMax: { $max: '$temperaturaC' },
          urMedia: { $avg: '$umiditaPerc' },
          precipitazioni: { $sum: '$precipitazioniMm' },
        },
      },
    ]);
    const meteoReale = aggreg.length > 0
      ? {
          tMin: aggreg[0].tMin !== null ? Number(aggreg[0].tMin.toFixed(1)) : null,
          tMax: aggreg[0].tMax !== null ? Number(aggreg[0].tMax.toFixed(1)) : null,
          urMedia: aggreg[0].urMedia !== null ? Math.round(aggreg[0].urMedia) : null,
          precipitazioni: Number((aggreg[0].precipitazioni ?? 0).toFixed(1)),
        }
      : { tMin: null, tMax: null, urMedia: null, precipitazioni: null };

    // Coltura corrente (per la fase fenologica)
    const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });
    const fase = coltura?.fase || null;

    // Indici reali correnti (riusano i service esistenti — calcolo on-demand sulle ultime 48h)
    const fitosanitario = coltura
      ? await rischioFitosanitarioService.calcolaRischioFitosanitario(coltura)
      : null;
    const climatico = await rischioClimaticoService.calcolaRischioClimatico(field, coltura);

    return res.status(200).json({
      campoNome: field.nome,
      meteoReale,
      fase,
      indici: {
        fitosanitario: fitosanitario || null,
        climatico: climatico || null,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// US56: POST /api/v1/fields/:fieldId/simulatore/ricalcola
// Ricalcola gli indici di rischio a partire dai parametri meteo simulati passati nel body.
router.post('/ricalcola', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    const { tMin, tMax, urMedia, precipitazioni } = req.body || {};

    // Recupera la fase dalla coltura corrente del campo (può essere null)
    const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });
    const fase = coltura?.fase || null;

    const { fitosanitario, climatico } = await simulatoreService.calcolaIndiciSimulati({
      tMin, tMax, urMedia, precipitazioni, fase,
    });

    return res.status(200).json({ fitosanitario, climatico });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;