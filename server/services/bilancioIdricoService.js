const mongoose = require('mongoose');
const DatiMeteo = require('../models/DatiMeteo');
const Coltura = require('../models/Coltura');
const BilancioIdricoGiornaliero = require('../models/BilancioIdricoGiornaliero');

// ────────────────────────────────────────────────────────────────────────────────
// SERVIZIO BILANCIO IDRICO GIORNALIERO — US31
//
// Implementa il modello FAO-56 Hargreaves-Samani semplificato per stimare
// l'evapotraspirazione e il bilancio idrico del suolo di un appezzamento.
//
// Formula Hargreaves-Samani:
//   ET0 = 0.0023 × (Tmedia + 17.8) × √(Tmax - Tmin) × Ra
//
// dove Ra (radiazione extraterrestre) si calcola da latitudine + giorno dell'anno
// con formule astronomiche standard.
//
// Bilancio:
//   ETc = ET0 × Kc(fase)
//   riservaIdrica(oggi) = clamp(riservaIdrica(ieri) + precipitazioni - ETc, 0, 150)
//   umiditaSuoloPerc = (riservaIdrica / 150) × 100
// ────────────────────────────────────────────────────────────────────────────────

const CAPACITA_CAMPO_MM = 150; // mm di acqua disponibile nel suolo per vite in Trentino
const RISERVA_INIZIALE_DEFAULT = 75; // 50% della capacità (assumiamo suolo a metà a inizio storico)

// Coefficienti Kc per la vite (FAO-56)
const KC_VITE = {
  gemma_dormiente: 0.2,
  germogliamento: 0.3,
  fioritura: 0.7,
  allegagione: 0.85,
  invaiatura: 0.7,
  maturazione: 0.4,
  caduta_foglie: 0.2,
};

// ────────────────────────────────────────────────────────────────────────────────
// Calcola la radiazione extraterrestre Ra in MJ/m²/giorno
// Formula da FAO-56, paragrafo 3.5
// ────────────────────────────────────────────────────────────────────────────────
function calcolaRa(latitudineDeg, giornoDelAnno) {
  const phi = (latitudineDeg * Math.PI) / 180; // lat in radianti
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * giornoDelAnno) / 365); // distanza relativa Terra-Sole
  const delta = 0.409 * Math.sin((2 * Math.PI * giornoDelAnno) / 365 - 1.39); // declinazione solare
  const ws = Math.acos(-Math.tan(phi) * Math.tan(delta)); // angolo orario tramonto
  const Gsc = 0.0820; // costante solare MJ/m²/min

  const Ra =
    (24 * 60 / Math.PI) *
    Gsc *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));

  return Ra; // MJ/m²/giorno
}

// Conversione MJ/m²/giorno → mm/giorno equivalenti di evapotraspirazione
function MJtoMM(MJ) {
  return MJ * 0.408;
}

// ────────────────────────────────────────────────────────────────────────────────
// Calcola ET0 con Hargreaves-Samani
// ────────────────────────────────────────────────────────────────────────────────
function calcolaET0(tMaxC, tMinC, latitudineDeg, data) {
  const tMedia = (tMaxC + tMinC) / 2;
  const giornoDelAnno = Math.floor((data - new Date(data.getFullYear(), 0, 0)) / 86400000);
  const Ra = calcolaRa(latitudineDeg, giornoDelAnno);
  const RaMM = MJtoMM(Ra);

  const deltaT = Math.max(0, tMaxC - tMinC);
  const ET0 = 0.0023 * (tMedia + 17.8) * Math.sqrt(deltaT) * RaMM;
  return Math.max(0, ET0); // ET0 non può essere negativa
}

// ────────────────────────────────────────────────────────────────────────────────
// Aggrega le rilevazioni DatiMeteo di un giorno per un campo:
// restituisce {tMin, tMax, precipitazioniTotali}
// ────────────────────────────────────────────────────────────────────────────────
async function getDatiAggregatiGiorno(appezzamentoId, dataInizio, dataFine) {
  const result = await DatiMeteo.aggregate([
    {
      $match: {
        appezzamentoId: new mongoose.Types.ObjectId(appezzamentoId),
        timestamp: { $gte: dataInizio, $lt: dataFine },
      },
    },
    {
      $group: {
        _id: null,
        tMin: { $min: '$temperaturaC' },
        tMax: { $max: '$temperaturaC' },
        precipitazioniTotali: { $sum: '$precipitazioniMm' },
        conteggio: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) return null;
  const r = result[0];
  if (r.tMin === null || r.tMax === null) return null;
  return {
    tMin: r.tMin,
    tMax: r.tMax,
    precipitazioniTotali: r.precipitazioniTotali || 0,
    conteggio: r.conteggio,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Calcola il bilancio idrico del giorno per un campo
// data: Date del giorno (verrà normalizzata a 00:00)
// ────────────────────────────────────────────────────────────────────────────────
async function calcolaBilancioGiorno(field, data) {
  // Normalizza al giorno (00:00 locale)
  const dataNorm = new Date(data);
  dataNorm.setHours(0, 0, 0, 0);
  const dataFine = new Date(dataNorm);
  dataFine.setDate(dataFine.getDate() + 1);

  // 1. Aggrega dati meteo del giorno
  const datiGiorno = await getDatiAggregatiGiorno(field._id, dataNorm, dataFine);
  if (!datiGiorno) {
    throw new Error('Nessun dato meteo disponibile per il giorno indicato');
  }

  // 2. Recupera la coltura corrente per ottenere la fase
  const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });
  if (!coltura) {
    throw new Error('Nessuna coltura associata al campo');
  }
  if (!coltura.fase) {
    throw new Error('La coltura del campo non ha una fase fenologica impostata');
  }

  const Kc = KC_VITE[coltura.fase];
  if (Kc === undefined) {
    throw new Error(`Coefficiente Kc non disponibile per fase '${coltura.fase}'`);
  }

  // 3. Calcola ET0 e ETc
  const ET0 = calcolaET0(datiGiorno.tMax, datiGiorno.tMin, field.latitudine, dataNorm);
  const ETc = ET0 * Kc;

  // 4. Recupera bilancio di ieri (per accumulare la riserva)
  const dataIeri = new Date(dataNorm);
  dataIeri.setDate(dataIeri.getDate() - 1);
  const bilancioIeri = await BilancioIdricoGiornaliero.findOne({
    appezzamentoId: field._id,
    data: dataIeri,
  });
  const riservaIeri = bilancioIeri ? bilancioIeri.riservaIdricaMm : RISERVA_INIZIALE_DEFAULT;

  // 5. Calcola bilancio del giorno e riserva accumulata
  const bilancio = datiGiorno.precipitazioniTotali - ETc;
  let riservaIdricaMm = riservaIeri + bilancio;
  // Clamp 0..capacità
  if (riservaIdricaMm < 0) riservaIdricaMm = 0;
  if (riservaIdricaMm > CAPACITA_CAMPO_MM) riservaIdricaMm = CAPACITA_CAMPO_MM;

  const umiditaSuoloPerc = Math.round((riservaIdricaMm / CAPACITA_CAMPO_MM) * 100);

  // 6. Upsert nel DB
  const doc = await BilancioIdricoGiornaliero.findOneAndUpdate(
    { appezzamentoId: field._id, data: dataNorm },
    {
      $set: {
        appezzamentoId: field._id,
        data: dataNorm,
        precipitazioniMm: Number(datiGiorno.precipitazioniTotali.toFixed(2)),
        evapotraspirazioneMm: Number(ETc.toFixed(2)),
        bilancio: Number(bilancio.toFixed(2)),
        riservaIdricaMm: Number(riservaIdricaMm.toFixed(2)),
        umiditaSuoloPerc,
      },
    },
    { upsert: true, new: true }
  );

  return doc;
}

// ────────────────────────────────────────────────────────────────────────────────
// Calcola il bilancio idrico "corrente" ON-DEMAND, SENZA persistere — US48
//
// Speculare al fallback on-demand dei trattamenti (rischioFitosanitarioService):
// quando per un campo non esiste alcuno snapshot di bilancio storico, la
// classificazione dell'irrigazione può comunque stimare l'umidità del suolo
// calcolandola al volo sul giorno indicato (default: oggi).
//
// A differenza di calcolaBilancioGiorno NON lancia eccezioni e NON scrive sul DB:
// ritorna null se mancano dati meteo / coltura / fase, lasciando alla
// classificazione la decisione di marcare l'intervento come "Non valutabile".
// ────────────────────────────────────────────────────────────────────────────────
async function calcolaBilancioOnDemand(field, data = new Date()) {
  const dataNorm = new Date(data);
  dataNorm.setHours(0, 0, 0, 0);
  const dataFine = new Date(dataNorm);
  dataFine.setDate(dataFine.getDate() + 1);

  const datiGiorno = await getDatiAggregatiGiorno(field._id, dataNorm, dataFine);
  if (!datiGiorno) return null;

  const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });
  if (!coltura || !coltura.fase) return null;
  const Kc = KC_VITE[coltura.fase];
  if (Kc === undefined) return null;

  const ET0 = calcolaET0(datiGiorno.tMax, datiGiorno.tMin, field.latitudine, dataNorm);
  const ETc = ET0 * Kc;

  const dataIeri = new Date(dataNorm);
  dataIeri.setDate(dataIeri.getDate() - 1);
  const bilancioIeri = await BilancioIdricoGiornaliero.findOne({
    appezzamentoId: field._id,
    data: dataIeri,
  });
  const riservaIeri = bilancioIeri ? bilancioIeri.riservaIdricaMm : RISERVA_INIZIALE_DEFAULT;

  let riservaIdricaMm = riservaIeri + (datiGiorno.precipitazioniTotali - ETc);
  if (riservaIdricaMm < 0) riservaIdricaMm = 0;
  if (riservaIdricaMm > CAPACITA_CAMPO_MM) riservaIdricaMm = CAPACITA_CAMPO_MM;

  return { umiditaSuoloPerc: Math.round((riservaIdricaMm / CAPACITA_CAMPO_MM) * 100) };
}

// ────────────────────────────────────────────────────────────────────────────────
// Calcola il bilancio per TUTTI i campi del sistema (usato dal cron)
// ────────────────────────────────────────────────────────────────────────────────
async function calcolaBilancioTuttiCampi(data = new Date()) {
  const Field = require('../models/Field');
  const campi = await Field.find({});
  let calcolati = 0;
  let errori = 0;
  const dettagli = [];

  for (const campo of campi) {
    try {
      await calcolaBilancioGiorno(campo, data);
      calcolati++;
    } catch (err) {
      errori++;
      dettagli.push({ campoId: campo._id.toString(), nome: campo.nome, errore: err.message });
    }
  }

  return { totaleCampi: campi.length, calcolati, errori, dettagli };
}

module.exports = {
  calcolaET0,
  calcolaRa,
  calcolaBilancioGiorno,
  calcolaBilancioOnDemand,
  calcolaBilancioTuttiCampi,
  KC_VITE,
  CAPACITA_CAMPO_MM,
};