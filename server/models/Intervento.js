const mongoose = require('mongoose');

// Modello Intervento (US41 + US42)
// Riferimento UML D2: classe astratta InterventoAgronomico con sottoclassi
// TrattamentoFitosanitario e Irrigazione.
// Implementazione: discriminator pattern via campo `tipologia`.

const interventoSchema = new mongoose.Schema(
  {
    appezzamentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: true,
      index: true,
    },
    dataOra: {
      type: Date,
      required: true,
      default: Date.now,
    },
    tipologia: {
      type: String,
      enum: ['trattamento', 'irrigazione'],
      required: true,
    },
    note: { type: String, default: '' },

    // Campi specifici per TRATTAMENTO (US41)
    principioAttivo: { type: String, default: null },
    quantita: { type: Number, default: null, min: 0 },
    unitaMisura: { type: String, default: null }, // es: 'kg/ha', 'L/ha'

    // Campi specifici per IRRIGAZIONE (US42)
    volumeAcqua: { type: Number, default: null, min: 0 }, // litri
  },
  { timestamps: true }
);

// Validazione condizionale a livello documento
interventoSchema.pre('validate', function (next) {
  if (this.tipologia === 'trattamento') {
    if (!this.principioAttivo || !this.principioAttivo.trim()) {
      return next(new Error('principioAttivo non può essere vuoto'));
    }
    if (this.quantita == null || this.quantita < 0) {
      return next(new Error('quantita deve essere >= 0'));
    }
  } else if (this.tipologia === 'irrigazione') {
    if (this.volumeAcqua == null || this.volumeAcqua <= 0) {
      return next(new Error('volumeAcqua deve essere > 0'));
    }
  }
  next();
});

interventoSchema.index({ appezzamentoId: 1, dataOra: -1 });

module.exports = mongoose.model('Intervento', interventoSchema);