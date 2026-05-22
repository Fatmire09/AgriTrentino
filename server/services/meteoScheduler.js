const cron = require('node-cron');
const Field = require('../models/Field');
const meteoService = require('./meteoService');

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

  let aggiornati = 0;
  let errori = 0;

  try {
    const campi = await Field.find({});
    for (const campo of campi) {
      try {
        await meteoService.aggiornaMeteoCampo(campo);
        aggiornati++;
      } catch (err) {
        errori++;
        console.error(`[meteo scheduler] errore campo ${campo._id}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('[meteo scheduler] errore globale:', err.message);
  }

  stato.ultimaEsecuzione = inizio;
  stato.campiAggiornatiUltimaEsecuzione = aggiornati;
  stato.campiErroriUltimaEsecuzione = errori;

  const durataMs = Date.now() - inizio.getTime();
  console.log(`[meteo scheduler] Fine: ${aggiornati} campi aggiornati, ${errori} errori, ${durataMs}ms`);
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

module.exports = {
  avvia,
  ferma,
  getStato,
  eseguiAggiornamento, // esportato per test manuale
};