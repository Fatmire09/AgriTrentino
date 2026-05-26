const IndiceRischio = require('../models/IndiceRischio');
const BilancioIdricoGiornaliero = require('../models/BilancioIdricoGiornaliero');

// ────────────────────────────────────────────────────────────────────────────────
// CLASSIFICAZIONE INTERVENTO — US43
// Classifica un intervento confrontandolo col rischio che doveva contrastare,
// alla sua data:
//   - trattamento  ↔️ indice fitosanitario del giorno (IndiceRischio, US40)
//   - irrigazione  ↔️ bilancio idrico del giorno (umidità suolo, US31)
// ────────────────────────────────────────────────────────────────────────────────

// Estremi del giorno dell'intervento (per matchare i record salvati a mezzanotte)
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
    const indice = await IndiceRischio.findOne({
      appezzamentoId: intervento.appezzamentoId,
      tipoRischio: 'fitosanitario',
      data: { $gte: inizio, $lt: fine },
    });
    if (!indice) return { classificazione: 'Non valutabile', livello: null };
    return {
      classificazione: indice.livello === 'basso' ? 'Superfluo' : 'Giustificato',
      livello: indice.livello, // basso | medio | alto
    };
  }

  if (intervento.tipologia === 'irrigazione') {
    const bilancio = await BilancioIdricoGiornaliero.findOne({
      appezzamentoId: intervento.appezzamentoId,
      data: { $gte: inizio, $lt: fine },
    });
    if (!bilancio) return { classificazione: 'Non valutabile', livello: null };
    return {
      classificazione: bilancio.umiditaSuoloPerc >= 60 ? 'Superfluo' : 'Giustificato',
      livello: `suolo ${bilancio.umiditaSuoloPerc}%`,
    };
  }

  return { classificazione: 'Non valutabile', livello: null };
}

module.exports = { classificaIntervento };