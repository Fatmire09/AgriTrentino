const mongoose = require('mongoose');
const DatiMeteo = require('../models/DatiMeteo');
const Coltura = require('../models/Coltura');

// ────────────────────────────────────────────────────────────────────────────────
// SERVIZIO AVANZAMENTO FENOLOGICO — US32
//
// Implementa il modello Growing Degree Days (GDD) per stimare automaticamente
// quando una coltura passa da una fase fenologica alla successiva senza intervento
// manuale dell'utente.
//
// Formula GDD giornaliero:
//   GDD = max(0, Tmedia - Tbase)
//   con Tbase = 10°C per la vite (fonte: letteratura agronomica viticoltura)
//
// Le soglie sono calibrate per la viticoltura del Trentino e rappresentano i GDD
// medi accumulati tra fasi consecutive.
// ────────────────────────────────────────────────────────────────────────────────

const T_BASE_VITE = 10; // °C — temperatura base per la vite

// Soglie GDD per transizione tra fasi consecutive (vite)
// Fonte: letteratura agronomica + dati osservativi Trentino
const SOGLIE_GDD_VITE = {
  gemma_dormiente: { successiva: 'germogliamento', soglia: 50 },
  germogliamento:  { successiva: 'fioritura',     soglia: 350 },
  fioritura:       { successiva: 'allegagione',   soglia: 200 },
  allegagione:     { successiva: 'invaiatura',    soglia: 600 },
  invaiatura:      { successiva: 'maturazione',   soglia: 400 },
  maturazione:     { successiva: 'caduta_foglie', soglia: 800 },
  caduta_foglie:   null, // fase finale, non avanza più
};

// ────────────────────────────────────────────────────────────────────────────────
// Calcola i GDD accumulati per un campo dalla data inizio fino a oggi (escluso)
// ────────────────────────────────────────────────────────────────────────────────
async function calcolaGddAccumulati(appezzamentoId, dataInizio, dataFine = new Date()) {
  // Aggrega le temperature giornaliere (min/max → media)
  const dati = await DatiMeteo.aggregate([
    {
      $match: {
        appezzamentoId: new mongoose.Types.ObjectId(appezzamentoId),
        timestamp: { $gte: dataInizio, $lt: dataFine },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        tMin: { $min: '$temperaturaC' },
        tMax: { $max: '$temperaturaC' },
      },
    },
  ]);

  let gddTotali = 0;
  for (const giorno of dati) {
    if (giorno.tMin === null || giorno.tMax === null) continue;
    const tMedia = (giorno.tMin + giorno.tMax) / 2;
    const gddGiorno = Math.max(0, tMedia - T_BASE_VITE);
    gddTotali += gddGiorno;
  }

  return Math.round(gddTotali * 10) / 10;
}

// ────────────────────────────────────────────────────────────────────────────────
// Calcola lo stato fenologico corrente di una coltura (senza modificarla)
// ────────────────────────────────────────────────────────────────────────────────
async function calcolaStatoFenologico(coltura) {
  if (!coltura.fase) {
    return null;
  }
  const config = SOGLIE_GDD_VITE[coltura.fase];
  if (!config) {
    return null;
  }

  const dataInizio = coltura.dataAggiornamento || coltura.createdAt;
  const gddAccumulati = await calcolaGddAccumulati(coltura.appezzamentoId, dataInizio);

  return {
    colturaId: coltura._id,
    tipologia: coltura.tipologia,
    varieta: coltura.varieta,
    faseCorrente: coltura.fase,
    dataInizioFase: dataInizio,
    gddAccumulati,
    fasePossibileSuccessiva: config.successiva,
    sogliaGddProssima: config.soglia,
    percentualeProgresso: Math.min(100, Math.round((gddAccumulati / config.soglia) * 100)),
    tBaseC: T_BASE_VITE,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Verifica e applica l'avanzamento automatico per una coltura
// Restituisce true se la fase è avanzata, false altrimenti
// ────────────────────────────────────────────────────────────────────────────────
async function avanzaFaseSeNecessario(coltura) {
  if (!coltura.fase) return false;
  const config = SOGLIE_GDD_VITE[coltura.fase];
  if (!config || !config.successiva) return false; // fase finale o sconosciuta

  const dataInizio = coltura.dataAggiornamento || coltura.createdAt;
  const gddAccumulati = await calcolaGddAccumulati(coltura.appezzamentoId, dataInizio);

  if (gddAccumulati >= config.soglia) {
    coltura.fase = config.successiva;
    coltura.dataAggiornamento = new Date();
    await coltura.save();
    return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────────────
// Esegue l'avanzamento automatico su TUTTE le colture (usato dal cron)
// ────────────────────────────────────────────────────────────────────────────────
async function avanzaFasiTutteColture() {
  const colture = await Coltura.find({ fase: { $ne: null } });
  let avanzate = 0;
  let errori = 0;
  const dettagli = [];

  for (const coltura of colture) {
    try {
      const avanzata = await avanzaFaseSeNecessario(coltura);
      if (avanzata) {
        avanzate++;
        dettagli.push({
          colturaId: coltura._id.toString(),
          appezzamentoId: coltura.appezzamentoId.toString(),
          nuovaFase: coltura.fase,
        });
      }
    } catch (err) {
      errori++;
    }
  }

  return { totaleColture: colture.length, avanzate, errori, dettagli };
}

module.exports = {
  calcolaGddAccumulati,
  calcolaStatoFenologico,
  avanzaFaseSeNecessario,
  avanzaFasiTutteColture,
  T_BASE_VITE,
  SOGLIE_GDD_VITE,
};