// services/simulatoreService.js
// US56: calcola gli indici di rischio "simulati" a partire da valori meteo scalari
// passati dal client del simulatore. Logica semplificata coerente con US33 (fitosanitario
// peronospora) e US35 (climatico: gelate / stress termico / eccesso UR), adattata a input
// scalari (i service reali aggregano 48h di DatiMeteo dal DB).

const FASI_SUSCETTIBILI = ['Fioritura', 'Allegagione', 'Sviluppo grappolo'];
const FASI_POCO_SUSCETTIBILI = ['Maturazione', 'Riposo'];

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

module.exports = { calcolaIndiciSimulati };