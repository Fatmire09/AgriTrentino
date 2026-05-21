const mongoose = require('mongoose');
const { TIPOLOGIE_COLTURA } = require('../constants/colture');

// Modello Coltura (US21, US22, US23)
// Riferimento UML D2: classe Coltura aggregata a Appezzamento
// (tipologia: TipologiaColtura enum, varieta: String, fase: FaseFenologica enum, dataAggiornamento: Date)

const colturaSchema = new mongoose.Schema(
  {
    appezzamentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: [true, 'Il riferimento all\'appezzamento è obbligatorio'],
      index: true,
    },
    tipologia: {
      type: String,
      enum: {
        values: TIPOLOGIE_COLTURA,
        message: `tipologia deve essere una tra: ${TIPOLOGIE_COLTURA.join(', ')}`,
      },
      required: [true, 'La tipologia della coltura è obbligatoria'],
    },
    varieta: {
      type: String,
      default: null,
      // US22 introdurrà la validazione enum collegata a tipologia
    },
    fase: {
      type: String,
      default: null,
      // US23 introdurrà la validazione enum (FasiFenologiche)
    },
    dataAggiornamento: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indice composito: recupera velocemente le colture di un appezzamento ordinate dalla più recente
colturaSchema.index({ appezzamentoId: 1, createdAt: -1 });

module.exports = mongoose.model('Coltura', colturaSchema);