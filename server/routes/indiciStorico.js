const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const IndiceRischio = require('../models/IndiceRischio');

router.get('/storico', requireAuth, async (req, res) => {
  try {
    const field = await Field.findById(req.params.fieldId);
    if (!field) return res.status(404).json({ error: 'Appezzamento non trovato' });
    if (field.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const GIORNI_DEFAULT = 365;
    const GIORNI_MAX = 730;
    let giorni = parseInt(req.query.giorni, 10);
    if (isNaN(giorni) || giorni < 1) giorni = GIORNI_DEFAULT;
    if (giorni > GIORNI_MAX) giorni = GIORNI_MAX;

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - giorni);

    const filtro = { appezzamentoId: field._id, data: { $gte: limite } };
    if (req.query.tipo && ['fitosanitario', 'climatico'].includes(req.query.tipo)) {
      filtro.tipoRischio = req.query.tipo;
    }

    const records = await IndiceRischio.find(filtro)
      .sort({ data: 1 })
      .select('data tipoRischio livello valore minaccia -_id');

    return res.status(200).json({
      storico: records,
      totaleRecord: records.length,
      periodoGiorni: giorni,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;