const mongoose = require('mongoose');

const ORIENTAMENTI = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const appezzamentoSchema = new mongoose.Schema(
  {
    denominazione: { type: String, required: true, trim: true },
    latitudine: { type: Number, required: true },
    longitudine: { type: Number, required: true },
    superficieHa: { type: Number, required: true, min: 0 },
    pendenzaPerc: { type: Number, min: 0, max: 100 },
    orientamento: { type: String, enum: ORIENTAMENTI },
    proprietario: { type: mongoose.Schema.Types.ObjectId, ref: 'Utente', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appezzamento', appezzamentoSchema);
