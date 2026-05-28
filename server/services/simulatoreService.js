// services/simulatoreService.js
// US56: calcola gli indici di rischio "simulati" a partire da valori meteo scalari
// passati dal client del simulatore. Logica semplificata coerente con US33 (fitosanitario
// peronospora) e US35 (climatico: gelate / stress termico / eccesso UR), adattata a input
// scalari (i service reali aggregano 48h di DatiMeteo dal DB).

const FASI_SUSCETTIBILI = ['Fioritura', 'Allegagione', 'Sviluppo grappolo'];
const FASI_POCO_SUSCETTIBILI = ['Maturazione', 'Riposo'];

// US58 (D2 §2.5.2 ParametriSimulazione.isValid()): range fisicamente plausibili dei parametri meteo
const RANGE_PLAUSIBILE = {
  tMin: { min: -25, max: 30, label: 'Temperatura minima', unita: '°C' },
  tMax: { min: -10, max: 45, label: 'Temperatura massima', unita: '°C' },
  urMedia: { min: 0, max: 100, label: 'Umidità relativa media', unita: '%' },
  precipitazioni: { min: 0, max: 200, label: 'Precipitazioni', unita: 'mm' },
};

function livelloDaValore(v) {
  if (v >= 67) return 'alto';
  if (v >= 34) return 'medio';
  return 'basso';
}

function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function calcolaFitosanitario({ tMin, tMax, urMedia, precipitazioni, fase }) {
  if (tMin == null || tMax == null || urMedia == null) {
    return { livello: 'basso', valore: 0 };
  }
  const tMedia = (tMin + tMax) / 2;
  const inRange = tMedia >= 15 && tMedia <= 25;

  // Base sul binomio UR + T media (modello peronospora)
  let v;
  if (urMedia >= 80 && inRange) v = 80;        // condizioni ottimali per peronospora
  else if (urMedia >= 80) v = 50;              // umido ma T fuori range
  else if (urMedia >= 60) v = 35;              // medio
  else v = 10;                                 // secco → rischio basso

  // Pioggia recente → favorisce sporulazione
  if (precipitazioni != null && precipitazioni >= 5) v += 10;

  // Modulazione per fase fenologica
  if (FASI_SUSCETTIBILI.includes(fase)) v += 15;
  else if (FASI_POCO_SUSCETTIBILI.includes(fase)) v -= 10;

  v = clamp(v);
  return { livello: livelloDaValore(v), valore: v };
}

function calcolaClimatico({ tMin, tMax, urMedia }) {
  if (tMin == null || tMax == null || urMedia == null) {
    return { livello: 'basso', valore: 0, minaccia: 'nessuna' };
  }

  // Gelate (dipendono da tMin)
  let valGelate = 0;
  if (tMin < 0) valGelate = 90;
  else if (tMin < 2) valGelate = 60;
  else if (tMin < 5) valGelate = 30;

  // Stress termico (dipende da tMax)
  let valStress = 0;
  if (tMax > 35) valStress = 90;
  else if (tMax > 32) valStress = 65;
  else if (tMax > 28) valStress = 35;

  // Eccesso umidità
  let valUmid = 0;
  if (urMedia > 95) valUmid = 75;
  else if (urMedia > 90) valUmid = 55;
  else if (urMedia > 80) valUmid = 30;

  // Minaccia dominante
  const minacce = [
    { nome: 'gelate', valore: valGelate },
    { nome: 'stress_termico', valore: valStress },
    { nome: 'eccesso_umidita', valore: valUmid },
  ];
  minacce.sort((a, b) => b.valore - a.valore);
  const dominante = minacce[0];
  const minaccia = dominante.valore > 0 ? dominante.nome : 'nessuna';

  return { livello: livelloDaValore(dominante.valore), valore: clamp(dominante.valore), minaccia };
}

async function calcolaIndiciSimulati({ tMin, tMax, urMedia, precipitazioni, fase }) {
  // Normalizza input (JSON può portare stringhe)
  const num = (x) => (x == null || x === '' ? null : Number(x));
  const params = {
    tMin: num(tMin),
    tMax: num(tMax),
    urMedia: num(urMedia),
    precipitazioni: num(precipitazioni),
  };

  const fitosanitario = calcolaFitosanitario({ ...params, fase });
  const climatico = calcolaClimatico(params);

  return { fitosanitario, climatico };
}

// US58 (D2 §2.5.2 ParametriSimulazione.isValid()): verifica la plausibilità fisica dei parametri
// e ritorna { valid, warnings:[{campo, valore, messaggio}] }. Lo scenario viene calcolato
// comunque: i warnings servono solo a informare l'utente che lo scenario è estremo/atipico.
function validaParametriSimulazione({ tMin, tMax, urMedia, precipitazioni }) {
  const num = (x) => (x == null || x === '' ? null : Number(x));
  const valori = {
    tMin: num(tMin),
    tMax: num(tMax),
    urMedia: num(urMedia),
    precipitazioni: num(precipitazioni),
  };

  const warnings = [];
  for (const [campo, val] of Object.entries(valori)) {
    if (val == null || Number.isNaN(val)) continue;
    const r = RANGE_PLAUSIBILE[campo];
    if (val < r.min || val > r.max) {
      warnings.push({
        campo,
        valore: val,
        messaggio: `${r.label} ${val} ${r.unita} fuori dal range plausibile (${r.min} … ${r.max} ${r.unita})`,
      });
    }
  }

  // Vincolo logico: tMin non può superare tMax
  if (valori.tMin != null && valori.tMax != null && valori.tMin > valori.tMax) {
    warnings.push({
      campo: 'tMin',
      valore: valori.tMin,
      messaggio: `Temperatura minima (${valori.tMin} °C) maggiore della massima (${valori.tMax} °C)`,
    });
  }

  return { valid: warnings.length === 0, warnings };
}

module.exports = { calcolaIndiciSimulati, validaParametriSimulazione };