const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Field = require('../models/Field');
const Intervento = require('../models/Intervento');
const IndiceRischio = require('../models/IndiceRischio');
const { classificaIntervento } = require('../services/classificazioneInterventoService');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// GET /api/v1/dashboard/sostenibilita — sintesi sostenibilità dell'utente (tutti i suoi campi)
router.get('/sostenibilita', requireAuth, async (req, res) => {
  try {
   const campi = await Field.find({ ownerId: req.userId }).select('_id').lean();
    const ids = campi.map((c) => c._id);
    const tutti = await Intervento.find({ appezzamentoId: { $in: ids } }).lean();

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

// US52: GET /api/v1/dashboard/trend-rischio?anno=YYYY — rischio medio giornaliero nella stagione
router.get('/trend-rischio', requireAuth, async (req, res) => {
  try {
    const campi = await Field.find({ ownerId: req.userId }).select('_id').lean();
    const ids = campi.map((c) => c._id);

    const anno = parseInt(req.query.anno, 10) || new Date().getFullYear();
    const inizio = new Date(anno, 0, 1);
    const fine = new Date(anno + 1, 0, 1);

    const records = await IndiceRischio.find({
      appezzamentoId: { $in: ids },
      data: { $gte: inizio, $lt: fine },
    }).select('data valore').lean();

    // Media per giorno (fito + clima di tutti i campi) → rischio medio giornaliero
    const perGiorno = {};
    for (const r of records) {
      const g = new Date(r.data).toISOString().slice(0, 10);
      if (!perGiorno[g]) perGiorno[g] = { somma: 0, n: 0 };
      perGiorno[g].somma += r.valore;
      perGiorno[g].n += 1;
    }
    const trend = Object.keys(perGiorno).sort().map((g) => ({
      data: g,
      rischioMedio: Math.round(perGiorno[g].somma / perGiorno[g].n),
    }));

    return res.status(200).json({ anno, trend });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// US54: GET /api/v1/dashboard/report?anno=YYYY — report PDF di sostenibilità
router.get('/report', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const campi = await Field.find({ ownerId: req.userId }).select('_id').lean();
    const ids = campi.map((c) => c._id);

    const anno = parseInt(req.query.anno, 10) || new Date().getFullYear();
    const inizioAnno = new Date(anno, 0, 1);
    const fineAnno = new Date(anno + 1, 0, 1);

    const interventi = await Intervento.find({
      appezzamentoId: { $in: ids },
      dataOra: { $gte: inizioAnno, $lt: fineAnno },
    }).lean();

    let giustificati = 0, superflui = 0, nonValutabili = 0;
    for (const iv of interventi) {
      const { classificazione } = await classificaIntervento(iv);
      if (classificazione === 'Giustificato') giustificati++;
      else if (classificazione === 'Superfluo') superflui++;
      else nonValutabili++;
    }
    const classificabili = giustificati + superflui;
    const percentualeGiustificati = classificabili > 0 ? Math.round((giustificati / classificabili) * 100) : null;

    const irrigazioni = interventi.filter((iv) => iv.tipologia === 'irrigazione');
    const litriIrrigati = irrigazioni.reduce((s, iv) => s + (iv.volumeAcqua || 0), 0);
    const campiIrrigati = new Set(irrigazioni.map((iv) => String(iv.appezzamentoId))).size;
    const risparmioIdricoLitri = irrigazioni.length > 0 ? Math.max(0, campiIrrigati * 5200 - litriIrrigati) : 0;

    const trattamenti = interventi.filter((iv) => iv.tipologia === 'trattamento');
    const kgTrattati = Math.round(trattamenti.reduce((s, iv) => s + (iv.quantita || 0), 0) * 10) / 10;
    const campiTrattati = new Set(trattamenti.map((iv) => String(iv.appezzamentoId))).size;
    const risparmioChimicoKg = trattamenti.length > 0 ? Math.max(0, Math.round((campiTrattati * 16 - kgTrattati) * 10) / 10) : 0;

    const recordsIndici = await IndiceRischio.find({ appezzamentoId: { $in: ids }, data: { $gte: inizioAnno, $lt: fineAnno } }).select('valore').lean();
    const rischioMedioAnnuo = recordsIndici.length > 0
      ? Math.round(recordsIndici.reduce((s, r) => s + r.valore, 0) / recordsIndici.length)
      : null;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-sostenibilita-${anno}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#16a34a').text('AgriTrentino — Report sostenibilità', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#333333').text(`Annata ${anno}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(11).fillColor('#666666');
    if (user) {
      doc.text(`Utente: ${user.nome || ''}`);
      if (user.nomeAzienda) doc.text(`Azienda: ${user.nomeAzienda}`);
      doc.text(`Email: ${user.email || ''}`);
    }
    doc.moveDown();

    doc.fontSize(14).fillColor('#16a34a').text('Indicatori di sostenibilità');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333333');
    doc.text(`Interventi registrati nell'annata: ${interventi.length}`);
    doc.text(`Interventi giustificati: ${percentualeGiustificati !== null ? percentualeGiustificati + '%' : 'n/d'}  (${giustificati} giustificati, ${superflui} superflui, ${nonValutabili} non valutabili)`);
    doc.text(`Risparmio idrico stimato: ${risparmioIdricoLitri.toLocaleString('it-IT')} L`);
    doc.text(`Risparmio chimico stimato: ${risparmioChimicoKg.toLocaleString('it-IT')} kg`);
    doc.text(`Rischio medio annuo: ${rischioMedioAnnuo !== null ? rischioMedioAnnuo + '/100' : 'n/d'}`);
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#999999').text(`Report generato il ${new Date().toLocaleString('it-IT')} — AgriTrentino DSS`, { align: 'center' });

    doc.end();
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;