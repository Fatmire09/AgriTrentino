const IndiceRischio = require('../models/IndiceRischio');
const BilancioIdricoGiornaliero = require('../models/BilancioIdricoGiornaliero');
const Coltura = require('../models/Coltura');
const Field = require('../models/Field');
const rischioFitosanitarioService = require('./rischioFitosanitarioService');
const bilancioIdricoService = require('./bilancioIdricoService');

// ────────────────────────────────────────────────────────────────────────────────
// CLASSIFICAZIONE INTERVENTO — US43 (+ fallback on-demand US48)
// Classifica un intervento confrontandolo col rischio della sua data:
//   - trattamento ↔ indice fitosanitario del giorno (IndiceRischio storico US40);
//     se il giorno non è coperto dallo storico (es. interventi di oggi) → indice on-demand
//   - irrigazione ↔ bilancio idrico del giorno; se assente → ultimo bilancio disponibile
// ────────────────────────────────────────────────────────────────────────────────

function rangeGiorno(dataOra) {
  const inizio = new Date(dataOra);
  inizio.setHours(0, 0, 0, 0);
  const fine = new Date(inizio);
  fine.setDate(fine.getDate() + 1);
  return { inizio, fine };
}

async function classificaIntervento(intervento) {
  const { inizio, fine } = rangeGiorno(intervento.dataOra);

  if (intervento.tipologia === 'trattamento') {
    // 1. snapshot storico del giorno
    const indice = await IndiceRischio.findOne({
      appezzamentoId: intervento.appezzamentoId,
      tipoRischio: 'fitosanitario',
      data: { $gte: inizio, $lt: fine },
    });
    let livello = indice ? indice.livello : null;
    // 2. fallback: nessuno snapshot per quel giorno → indice fitosanitario on-demand
    if (!livello) {
      const coltura = await Coltura.findOne({ appezzamentoId: intervento.appezzamentoId }).sort({ createdAt: -1 });
      const stato = await rischioFitosanitarioService.calcolaRischioFitosanitario(coltura);
      livello = stato ? stato.livello : null;
    }
    if (!livello) return { classificazione: 'Non valutabile', livello: null };
    return {
      classificazione: livello === 'basso' ? 'Superfluo' : 'Giustificato',
      livello,
    };
  }

  if (intervento.tipologia === 'irrigazione') {
    // 1. bilancio del giorno
    let bilancio = await BilancioIdricoGiornaliero.findOne({
      appezzamentoId: intervento.appezzamentoId,
      data: { $gte: inizio, $lt: fine },
    });
    // 2. fallback: bilancio più recente disponibile per il campo
    if (!bilancio) {
      bilancio = await BilancioIdricoGiornaliero.findOne({
        appezzamentoId: intervento.appezzamentoId,
      }).sort({ data: -1 });
    }
    let umiditaSuoloPerc = bilancio ? bilancio.umiditaSuoloPerc : null;
    // 3. fallback on-demand: nessuno snapshot di bilancio per il campo → calcolo corrente
    //    (speculare al fallback fitosanitario on-demand dei trattamenti)
    if (umiditaSuoloPerc === null) {
      const field = await Field.findById(intervento.appezzamentoId);
      const corrente = field ? await bilancioIdricoService.calcolaBilancioOnDemand(field) : null;
      umiditaSuoloPerc = corrente ? corrente.umiditaSuoloPerc : null;
    }
    if (umiditaSuoloPerc === null) return { classificazione: 'Non valutabile', livello: null };
    return {
      classificazione: umiditaSuoloPerc >= 60 ? 'Superfluo' : 'Giustificato',
      livello: `suolo ${umiditaSuoloPerc}%`,
    };
  }

  return { classificazione: 'Non valutabile', livello: null };
}

module.exports = { classificaIntervento };