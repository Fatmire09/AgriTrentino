const mongoose = require('mongoose');
const DatiMeteo = require('../models/DatiMeteo');

// ────────────────────────────────────────────────────────────────────────────────
// SERVIZIO RISCHIO CLIMATICO — US35
//
// Calcola un indice di rischio per le minacce climatiche alpine, sulla finestra
// delle ultime 48 ore. Valuta tre minacce e restituisce quella con il livello più alto:
//   - gelate (incl. gelate tardive): da Tmin, pesata per sensibilità della fase + esposizione nord
//   - stress termico (caldo): da Tmax
//   - eccesso di umidità: % di rilevazioni con UR > 90%
//
// Livelli: punteggio < 33 → basso · 33-65 → medio · >= 66 → alto
// ────────────────────────────────────────────────────────────────────────────────

const FINESTRA_ORE = 48;

// Sensibilità della vite al GELO per fase fenologica (tessuti giovani = più vulnerabili)
const SENSIBILITA_GELO = {
  gemma_dormiente: 0.3,
  germogliamento: 1.2,
  fioritura: 1.2,
  allegagione: 1.0,
  invaiatura: 0.8,
  maturazione: 0.8,
  caduta_foglie: 0.3,
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function livelloDaPunteggio(punteggio) {
  if (punteggio >= 66) return 'alto';
  if (punteggio >= 33) return 'medio';
  return 'basso';
}

// Esposizione a nord → maggior rischio gelate (meno irraggiamento, gelo persistente)
function fattoreEsposizione(esposizione) {
  if (!esposizione) return 1.0;
  return esposizione.toLowerCase().includes('nord') ? 1.15 : 1.0;
}

// Aggrega la finestra: Tmin, Tmax, e conteggio ore con umidità molto alta (> 90%)
async function aggregaFinestra(appezzamentoId, dataInizio, dataFine) {
  const dati = await DatiMeteo.find({
    appezzamentoId: new mongoose.Types.ObjectId(appezzamentoId),
    timestamp: { $gte: dataInizio, $lt: dataFine },
  }).select('temperaturaC umiditaPerc');

  let tMin = null;
  let tMax = null;
  let totaliUmidita = 0;
  let oreUmide = 0;
  for (const d of dati) {
    if (d.temperaturaC !== null) {
      tMin = tMin === null ? d.temperaturaC : Math.min(tMin, d.temperaturaC);
      tMax = tMax === null ? d.temperaturaC : Math.max(tMax, d.temperaturaC);
    }
    if (d.umiditaPerc !== null) {
      totaliUmidita++;
      if (d.umiditaPerc > 90) oreUmide++;
    }
  }
  return { tMin, tMax, totaliUmidita, oreUmide };
}

function punteggioGelate(tMin, fase, esposizione) {
  if (tMin === null) return 0;
  let base;
  if (tMin <= -2) base = 90;
  else if (tMin <= 0) base = 70;
  else if (tMin <= 3) base = 40;
  else base = 5;
  const sensibilita = SENSIBILITA_GELO[fase] || 1.0;
  return clamp(Math.round(base * sensibilita * fattoreEsposizione(esposizione)), 0, 100);
}

function punteggioStressTermico(tMax) {
  if (tMax === null) return 0;
  if (tMax >= 38) return 90;
  if (tMax >= 35) return 70;
  if (tMax >= 32) return 40;
  return 5;
}

function punteggioEccessoUmidita(oreUmide, totaliUmidita) {
  if (totaliUmidita === 0) return 0;
  const perc = (oreUmide / totaliUmidita) * 100;
  if (perc >= 70) return 70;
  if (perc >= 40) return 40;
  return 10;
}

// Descrizione testuale della minaccia dominante (US36) — usata dal tooltip in UI
function descrizioneMinaccia(minaccia) {
  switch (minaccia) {
    case 'gelate':
      return 'Gelate: rischio di danni da freddo a germogli e fiori (tipico delle gelate tardive primaverili).';
    case 'stress_termico':
      return 'Stress termico: temperature elevate che possono causare scottature e blocco vegetativo.';
    case 'eccesso_umidita':
      return 'Eccesso di umidità: ristagni prolungati che favoriscono lo sviluppo di malattie fungine.';
    default:
      return 'Nessuna minaccia climatica rilevante al momento.';
  }
}

// Calcola l'indice climatico per un campo (coltura/fase opzionale). On-demand, nessuna persistenza.
// Ritorna null se non ci sono dati meteo nella finestra.
async function calcolaRischioClimatico(field, coltura) {
  const fase = coltura ? coltura.fase : null;

  const dataFine = new Date();
  const dataInizio = new Date(dataFine.getTime() - FINESTRA_ORE * 60 * 60 * 1000);
  const { tMin, tMax, totaliUmidita, oreUmide } = await aggregaFinestra(field._id, dataInizio, dataFine);

  if (tMin === null && tMax === null && totaliUmidita === 0) {
    return null; // nessun dato meteo utile nella finestra
  }

  const pGelate = punteggioGelate(tMin, fase, field.esposizione);
  const pStress = punteggioStressTermico(tMax);
  const pUmidita = punteggioEccessoUmidita(oreUmide, totaliUmidita);
  const percOreUmide = totaliUmidita ? Math.round((oreUmide / totaliUmidita) * 100) : 0;

  const minacce = [
    { minaccia: 'gelate', punteggio: pGelate },
    { minaccia: 'stress_termico', punteggio: pStress },
    { minaccia: 'eccesso_umidita', punteggio: pUmidita },
  ];
  const dominante = minacce.reduce((a, b) => (b.punteggio > a.punteggio ? b : a));
  const minaccia = dominante.punteggio === 0 ? 'nessuna' : dominante.minaccia;

  return {
    livello: livelloDaPunteggio(dominante.punteggio),
    minaccia,
    descrizione: descrizioneMinaccia(minaccia),
    punteggio: dominante.punteggio,
    faseCorrente: fase,
    esposizione: field.esposizione || null,
    finestraOre: FINESTRA_ORE,
    dettaglio: {
      gelate: { punteggio: pGelate, livello: livelloDaPunteggio(pGelate), tMinC: tMin },
      stressTermico: { punteggio: pStress, livello: livelloDaPunteggio(pStress), tMaxC: tMax },
      eccessoUmidita: { punteggio: pUmidita, livello: livelloDaPunteggio(pUmidita), percOreUmide },
    },
  };
}

module.exports = {
  calcolaRischioClimatico,
  descrizioneMinaccia,
  punteggioGelate,
  punteggioStressTermico,
  punteggioEccessoUmidita,
  livelloDaPunteggio,
  SENSIBILITA_GELO,
  FINESTRA_ORE,
};