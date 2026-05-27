const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');

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

// GET /api/v1/fields/:fieldId/consumi?giorni=N — totali acqua + principio attivo nel periodo
router.get('/', requireAuth, async (req, res) => {
  try {
    const field = await trovaCampoAutorizzato(req, res);
    if (!field) return;

    let giorni = parseInt(req.query.giorni, 10);
    if (isNaN(giorni) || giorni < 1) giorni = 60;
    const dal = new Date();
    dal.setDate(dal.getDate() - giorni);

    const interventi = await Intervento.find({
      appezzamentoId: field._id,
      dataOra: { $gte: dal },
    });

    const acquaTotaleLitri = interventi
      .filter((iv) => iv.tipologia === 'irrigazione')
      .reduce((s, iv) => s + (iv.volumeAcqua || 0), 0);
    const principioAttivoTotaleKg = Math.round(
      interventi.filter((iv) => iv.tipologia === 'trattamento').reduce((s, iv) => s + (iv.quantita || 0), 0) * 10
    ) / 10;

    return res.status(200).json({
      campoId: field._id,
      campoNome: field.nome,
      periodoGiorni: giorni,
      acquaTotaleLitri,
      principioAttivoTotaleKg,
      numeroInterventi: interventi.length,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID non valido' });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;