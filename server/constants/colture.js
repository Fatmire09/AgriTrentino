// Costanti per il modulo Colture
// Riferimenti: D1 RF07, D2 classe Coltura (tipologia: TipologiaColtura, fase: FaseFenologica)

// Tipologie di coltura supportate.
// Sprint #2: solo Vite. In roadmap: Melo, Piccoli Frutti (RF07).
const TIPOLOGIE_COLTURA = ['Vite'];

// Fasi fenologiche per la vite (saranno usate da US23)
const FASI_FENOLOGICHE_VITE = [
  'gemma_dormiente',
  'germogliamento',
  'fioritura',
  'allegagione',
  'invaiatura',
  'maturazione',
  'caduta_foglie',
];

// Varietà supportate per ogni tipologia (saranno usate da US22)
const VARIETA_PER_TIPOLOGIA = {
  Vite: ['Chardonnay', 'Pinot Nero', 'Müller-Thurgau', 'Teroldego', 'Marzemino'],
};

module.exports = {
  TIPOLOGIE_COLTURA,
  FASI_FENOLOGICHE_VITE,
  VARIETA_PER_TIPOLOGIA,
};