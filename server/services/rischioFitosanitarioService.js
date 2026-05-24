const mongoose = require('mongoose');
const DatiMeteo = require('../models/DatiMeteo');

// ────────────────────────────────────────────────────────────────────────────────
// SERVIZIO RISCHIO FITOSANITARIO — US33
//
// Calcola un indice di rischio per la PERONOSPORA della vite (Plasmopara viticola)
// incrociando i dati meteo delle ultime 48h con la fase fenologica della coltura.
//
// Condizione oraria favorevole all'infezione:
//   umidità relativa > 80%  AND  15°C <= temperatura <= 25°C
//
// Il punteggio (0-100) è la percentuale di ore favorevoli nella finestra, pesata
// per la suscettibilità della fase fenologica corrente. Soglie:
//   < 33 → basso · 33-65 → medio · >= 66 → alto
// ────────────────────────────────────────────────────────────────────────────────

const FINESTRA_ORE = 48;
const UR_SOGLIA_PERC = 80;
const TEMP_MIN_C = 15;
const TEMP_MAX_C = 25;

// Suscettibilità della vite alla peronospora per fase fenologica (0..1)
// fioritura e allegagione = massima vulnerabilità dei tessuti giovani/fiori
const SUSCETTIBILITA_PERONOSPORA = {
  gemma_dormiente: 0.1,
  germogliamento: 0.5,
  fioritura: 1.0,
  allegagione: 1.0,
  invaiatura: 0.7,
  maturazione: 0.4,
  caduta_foglie: 0.1,
};

function livelloDaPunteggio(punteggio) {
  if (punteggio >= 66) return 'alto';
  if (punteggio >= 33) return 'medio';
  return 'basso';
}

// Conta, nella finestra, le rilevazioni totali (con dati validi) e quelle favorevoli
async function contaOreFavorevoli(appezzamentoId, dataInizio, dataFine) {
  const dati = await DatiMeteo.find({
    appezzamentoId: new mongoose.Types.ObjectId(appezzamentoId),
    timestamp: { $gte: dataInizio, $lt: dataFine },
  }).select('temperaturaC umiditaPerc');

  let totali = 0;
  let favorevoli = 0;
  for (const d of dati) {
    if (d.temperaturaC === null || d.umiditaPerc === null) continue;
    totali++;
    if (
      d.umiditaPerc > UR_SOGLIA_PERC &&
      d.temperaturaC >= TEMP_MIN_C &&
      d.temperaturaC <= TEMP_MAX_C
    ) {
      favorevoli++;
    }
  }
  return { totali, favorevoli };
}

// Calcola l'indice fitosanitario per una coltura (senza persistere nulla)
// Ritorna null se manca la fase o non ci sono dati meteo nella finestra
async function calcolaRischioFitosanitario(coltura) {
  if (!coltura || !coltura.fase) return null;
  const suscettibilita = SUSCETTIBILITA_PERONOSPORA[coltura.fase];
  if (suscettibilita === undefined) return null;

  const dataFine = new Date();
  const dataInizio = new Date(dataFine.getTime() - FINESTRA_ORE * 60 * 60 * 1000);

  const { totali, favorevoli } = await contaOreFavorevoli(
    coltura.appezzamentoId,
    dataInizio,
    dataFine
  );
  if (totali === 0) return null; // nessun dato meteo utile nella finestra

  const percentualeFavorevole = (favorevoli / totali) * 100;
  const punteggio = Math.round(percentualeFavorevole * suscettibilita);

  return {
    patologia: 'peronospora',
    livello: livelloDaPunteggio(punteggio),
    punteggio,
    faseCorrente: coltura.fase,
    suscettibilitaFase: suscettibilita,
    oreAnalizzate: totali,
    oreFavorevoli: favorevoli,
    percentualeOreFavorevoli: Math.round(percentualeFavorevole),
    finestraOre: FINESTRA_ORE,
    soglie: { urPerc: UR_SOGLIA_PERC, tempMinC: TEMP_MIN_C, tempMaxC: TEMP_MAX_C },
  };
}

module.exports = {
  calcolaRischioFitosanitario,
  contaOreFavorevoli,
  livelloDaPunteggio,
  SUSCETTIBILITA_PERONOSPORA,
  FINESTRA_ORE,
};