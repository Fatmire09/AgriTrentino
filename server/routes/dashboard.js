const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');
const { classificaIntervento } = require('../services/classificazioneInterventoService');

// GET /api/v1/dashboard/sostenibilita — sintesi sostenibilità dell'utente (tutti i suoi campi)
router.get('/sostenibilita', requireAuth, async (req, res) => {
  try {
   const campi = await Field.find({ ownerId: req.userId }).select('_id');
    const ids = campi.map((c) => c._id);
    const tutti = await Intervento.find({ appezzamentoId: { $in: ids } });

    // US49: annate disponibili (anni con almeno un intervento), decrescenti
    const annateDisponibili = [...new Set(tutti.map((iv) => new Date(iv.dataOra).getFullYear()))]
      .sort((a, b) => b - a);

    // Annata selezionata: ?anno se valido, altrimenti la più recente disponibile (o l'anno corrente)
    const annoRichiesto = parseInt(req.query.anno, 10);
    const annoSelezionato = annateDisponibili.includes(annoRichiesto)
      ? annoRichiesto
      : (annateDisponibili[0] || new Date().getFullYear());

    // Interventi dell'annata selezionata
    const interventi = tutti.filter((iv) => new Date(iv.dataOra).getFullYear() === annoSelezionato);

    // US48: classifica ogni intervento e calcola la % di giustificati
    let giustificati = 0;
    let superflui = 0;
    let nonValutabili = 0;
    for (const iv of interventi) {
      const { classificazione } = await classificaIntervento(iv);
      if (classificazione === 'Giustificato') giustificati++;
      else if (classificazione === 'Superfluo') superflui++;
      else nonValutabili++;
    }
    const classificabili = giustificati + superflui;
    const percentualeGiustificati = classificabili > 0
      ? Math.round((giustificati / classificabili) * 100)
      : null;

    // US50: stima risparmio idrico vs gestione "a calendario"
    // Baseline: regime a calendario = 200 L/settimana × 26 settimane di stagione, per ogni campo irrigato
    const VOLUME_CALENDARIO_PER_CAMPO = 200 * 26; // 5200 L/stagione/campo
    const irrigazioni = interventi.filter((iv) => iv.tipologia === 'irrigazione');
    const litriIrrigati = irrigazioni.reduce((s, iv) => s + (iv.volumeAcqua || 0), 0);
    const campiIrrigati = new Set(irrigazioni.map((iv) => String(iv.appezzamentoId))).size;
    const baselineIdricaLitri = campiIrrigati * VOLUME_CALENDARIO_PER_CAMPO;
    const risparmioIdricoLitri = irrigazioni.length > 0
      ? Math.max(0, baselineIdricaLitri - litriIrrigati)
      : null;

    // US51: stima risparmio chimico vs gestione "a calendario"
    // Baseline: regime a calendario = 8 trattamenti/stagione × 2 kg di dose, per ogni campo trattato
    const KG_CALENDARIO_PER_CAMPO = 8 * 2; // 16 kg/stagione/campo
    const trattamenti = interventi.filter((iv) => iv.tipologia === 'trattamento');
    const kgTrattati = Math.round(trattamenti.reduce((s, iv) => s + (iv.quantita || 0), 0) * 10) / 10;
    const campiTrattati = new Set(trattamenti.map((iv) => String(iv.appezzamentoId))).size;
    const baselineChimicaKg = campiTrattati * KG_CALENDARIO_PER_CAMPO;
    const risparmioChimicoKg = trattamenti.length > 0
      ? Math.max(0, Math.round((baselineChimicaKg - kgTrattati) * 10) / 10)
      : null;

    return res.status(200).json({
      haInterventi: tutti.length > 0,
      annoSelezionato,
      annateDisponibili,
      interventiTotali: interventi.length,
      giustificati,
      superflui,
      nonValutabili,
      classificabili,
      percentualeGiustificati,
      litriIrrigati,
      baselineIdricaLitri,
      risparmioIdricoLitri,
      kgTrattati,
      baselineChimicaKg,
      risparmioChimicoKg,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;