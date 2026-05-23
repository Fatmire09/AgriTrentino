const cron = require('node-cron');
const meteoService = require('./meteoService');
const bilancioIdricoService = require('./bilancioIdricoService');

// ────────────────────────────────────────────────────────────────────────────────
// SCHEDULER METEO — US27
//
// Cron job che ogni ora (al minuto 0) aggiorna i dati meteo di tutti gli
// appezzamenti registrati nel sistema. Mantiene uno stato interno con
// l'ultima esecuzione, il numero di campi aggiornati e il numero di errori.
//
// Cron expression: "0 * * * *" = ogni ora al minuto 0 (10:00, 11:00, 12:00, ...)
// ────────────────────────────────────────────────────────────────────────────────

const CRON_EXPRESSION = '0 * * * *';
const CRON_DESCRIZIONE = 'Ogni ora al minuto 0';

// Stato dello scheduler (in memoria, viene resettato a ogni riavvio del server)
const stato = {
  attivo: false,
  cronExpression: CRON_EXPRESSION,
  descrizione: CRON_DESCRIZIONE,
  ultimaEsecuzione: null,
  campiAggiornatiUltimaEsecuzione: 0,
  campiErroriUltimaEsecuzione: 0,
};

let task = null;

// ────────────────────────────────────────────────────────────────────────────────
// Calcola la prossima esecuzione del cron (al prossimo minuto 0 di un'ora)
// ────────────────────────────────────────────────────────────────────────────────
function calcolaProssimaEsecuzione() {
  const ora = new Date();
  const prossima = new Date(ora);
  prossima.setHours(ora.getHours() + 1, 0, 0, 0);
  return prossima;
}

// ────────────────────────────────────────────────────────────────────────────────
// Esecuzione del job: aggiorna meteo per tutti i campi con stazione assegnata
// ────────────────────────────────────────────────────────────────────────────────
async function eseguiAggiornamento() {
  const inizio = new Date();
  console.log(`[meteo scheduler] Avvio aggiornamento alle ${inizio.toISOString()}`);

  let risultato = { totaleCampi: 0, aggiornati: 0, errori: 0, dettagliErrori: [] };
  try {
    risultato = await meteoService.aggiornaTuttiICampi();
  } catch (err) {
    console.error('[meteo scheduler] errore globale:', err.message);
  }

  stato.ultimaEsecuzione = inizio;
  stato.campiAggiornatiUltimaEsecuzione = risultato.aggiornati;
  stato.campiErroriUltimaEsecuzione = risultato.errori;

  if (risultato.dettagliErrori.length > 0) {
    for (const e of risultato.dettagliErrori) {
      console.error(`[meteo scheduler] errore campo ${e.campoId} "${e.nome}": ${e.errore}`);
    }
  }

  const durataMs = Date.now() - inizio.getTime();
  console.log(`[meteo scheduler] Fine: ${risultato.aggiornati}/${risultato.totaleCampi} campi aggiornati, ${risultato.errori} errori, ${durataMs}ms`);
}

// ────────────────────────────────────────────────────────────────────────────────
// Avvia lo scheduler (chiamato da server/index.js all'avvio del server)
// ────────────────────────────────────────────────────────────────────────────────
function avvia() {
  if (task) {
    console.log('[meteo scheduler] già avviato, ignoro chiamata duplicata');
    return;
  }
  task = cron.schedule(CRON_EXPRESSION, eseguiAggiornamento, {
    scheduled: true,
    timezone: 'Europe/Rome',
  });
  stato.attivo = true;
  console.log(`[meteo scheduler] Avviato con cron "${CRON_EXPRESSION}" (${CRON_DESCRIZIONE})`);
}

// ────────────────────────────────────────────────────────────────────────────────
// Ferma lo scheduler (utile per test / shutdown pulito)
// ────────────────────────────────────────────────────────────────────────────────
function ferma() {
  if (task) {
    task.stop();
    task = null;
  }
  stato.attivo = false;
  console.log('[meteo scheduler] Fermato');
}

// ────────────────────────────────────────────────────────────────────────────────
// Restituisce lo stato corrente (usato dall'endpoint GET /meteo/scheduler/status)
// ────────────────────────────────────────────────────────────────────────────────
function getStato() {
  return {
    ...stato,
    prossimaEsecuzione: stato.attivo ? calcolaProssimaEsecuzione() : null,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// CRON BILANCIO IDRICO — US31
// Calcola ogni notte alle 00:30 il bilancio idrico per tutti i campi
// ────────────────────────────────────────────────────────────────────────────────

const CRON_BILANCIO_EXPRESSION = '30 0 * * *';
const CRON_BILANCIO_DESCRIZIONE = 'Ogni notte alle 00:30';

const statoBilancio = {
  attivo: false,
  cronExpression: CRON_BILANCIO_EXPRESSION,
  descrizione: CRON_BILANCIO_DESCRIZIONE,
  ultimaEsecuzione: null,
  campiCalcolatiUltimaEsecuzione: 0,
  campiErroriUltimaEsecuzione: 0,
};

let taskBilancio = null;

async function eseguiCalcoloBilancio() {
  const inizio = new Date();
  console.log(`[bilancio cron] Avvio calcolo bilancio idrico alle ${inizio.toISOString()}`);

  let risultato = { totaleCampi: 0, calcolati: 0, errori: 0, dettagli: [] };
  try {
    // Calcola il bilancio del giorno precedente (perché ora 00:30, il giorno appena finito)
    const ieri = new Date(inizio);
    ieri.setDate(ieri.getDate() - 1);
    risultato = await bilancioIdricoService.calcolaBilancioTuttiCampi(ieri);
  } catch (err) {
    console.error('[bilancio cron] errore globale:', err.message);
  }

  statoBilancio.ultimaEsecuzione = inizio;
  statoBilancio.campiCalcolatiUltimaEsecuzione = risultato.calcolati;
  statoBilancio.campiErroriUltimaEsecuzione = risultato.errori;

  if (risultato.dettagli.length > 0) {
    for (const e of risultato.dettagli) {
      console.error(`[bilancio cron] errore campo ${e.campoId} "${e.nome}": ${e.errore}`);
    }
  }

  const durataMs = Date.now() - inizio.getTime();
  console.log(`[bilancio cron] Fine: ${risultato.calcolati}/${risultato.totaleCampi} campi calcolati, ${risultato.errori} errori, ${durataMs}ms`);
}

function avviaCronBilancio() {
  if (taskBilancio) {
    console.log('[bilancio cron] già avviato, ignoro chiamata duplicata');
    return;
  }
  taskBilancio = cron.schedule(CRON_BILANCIO_EXPRESSION, eseguiCalcoloBilancio, {
    scheduled: true,
    timezone: 'Europe/Rome',
  });
  statoBilancio.attivo = true;
  console.log(`[bilancio cron] Avviato con cron "${CRON_BILANCIO_EXPRESSION}" (${CRON_BILANCIO_DESCRIZIONE})`);
}

function fermaCronBilancio() {
  if (taskBilancio) {
    taskBilancio.stop();
    taskBilancio = null;
  }
  statoBilancio.attivo = false;
}

function getStatoBilancio() {
  return { ...statoBilancio };
}

module.exports = {
  avvia,
  ferma,
  getStato,
  eseguiAggiornamento,
  // US31
  avviaCronBilancio,
  fermaCronBilancio,
  getStatoBilancio,
  eseguiCalcoloBilancio,
};