const mongoose = require('mongoose');

// Modello IndiceRischio (US40)
// Riferimento UML D2: classe IndiceRischio (astratta) con sottoclassi
// IndiceRischioFitosanitario e IndiceRischioClimatico.
// Implementazione: tabella unica con campo discriminator `tipoRischio`.

const indiceRischioSchema = new mongoose.Schema(
  {
    appezzamentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: true,
      index: true,
    },
    data: {
      type: Date,
      required: true,
      // Giorno di riferimento normalizzato a 00:00
    },
    tipoRischio: {
      type: String,
      enum: ['fitosanitario', 'climatico'],
      required: true,
    },
    livello: {
      type: String,
      enum: ['basso', 'medio', 'alto'],
      required: true,
    },
    valore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      // Punteggio 0-100 (cfr. service di calcolo)
    },
    minaccia: { type: String, default: null },
    // Per fitosanitario: 'peronospora' ecc.
    // Per climatico: 'gelate_tardive', 'stress_termico', 'eccesso_umidita', 'venti_forti'
    dettagli: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

indiceRischioSchema.index({ appezzamentoId: 1, data: -1, tipoRischio: 1 });
indiceRischioSchema.index(
  { appezzamentoId: 1, data: 1, tipoRischio: 1 },
  { unique: true }
);

module.exports = mongoose.model('IndiceRischio', indiceRischioSchema);