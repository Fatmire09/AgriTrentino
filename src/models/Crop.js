const mongoose = require('mongoose');

const TIPOLOGIE_COLTURA = ['Melo', 'Vite', 'Piccoli Frutti', 'Pero', 'Ciliegio', 'Altro'];

const FASI_FENOLOGICHE = [
  'Dormienza',
  'Ripresa vegetativa',
  'Gemma gonfia',
  'Punta verde',
  'Mezza fioritura',
  'Piena fioritura',
  'Allegagione',
  'Frutto in crescita',
  'Pre-raccolta',
  'Raccolta',
  'Post-raccolta',
];

const colturaSchema = new mongoose.Schema(
  {
    tipologia: { type: String, required: true, enum: TIPOLOGIE_COLTURA },
    varieta: { type: String, trim: true },
    fase: { type: String, enum: FASI_FENOLOGICHE },
    dataAggiornamento: { type: Date, default: Date.now },
    appezzamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Appezzamento', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coltura', colturaSchema);
