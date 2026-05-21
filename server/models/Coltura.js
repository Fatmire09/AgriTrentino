const mongoose = require('mongoose');
const { TIPOLOGIE_COLTURA, VARIETA_PER_TIPOLOGIA, FASI_FENOLOGICHE_VITE } = require('../constants/colture');
// US23: mappa fase fenologica → tipologia (estensibile per future tipologie)
const FASI_PER_TIPOLOGIA = {
  Vite: FASI_FENOLOGICHE_VITE,
};

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
      validate: {
        validator: function (valore) {
          // null/undefined sono ammessi (varietà non specificata)
          if (valore === null || valore === undefined || valore === '') return true;
          // se valorizzata, deve essere coerente con la tipologia
          const ammesse = VARIETA_PER_TIPOLOGIA[this.tipologia] || [];
          return ammesse.includes(valore);
        },
        message: function (props) {
          const ammesse = VARIETA_PER_TIPOLOGIA[this.tipologia] || [];
          return `varieta '${props.value}' non valida per tipologia '${this.tipologia}'. Varietà ammesse: ${ammesse.join(', ')}`;
        },
      },
    },
    fase: {
      type: String,
      default: null,
      validate: {
        validator: function (valore) {
          // null/undefined/stringa vuota sono ammessi (fase non specificata)
          if (valore === null || valore === undefined || valore === '') return true;
          // se valorizzata, deve essere una fase ammessa per la tipologia
          const ammesse = FASI_PER_TIPOLOGIA[this.tipologia] || [];
          return ammesse.includes(valore);
        },
        message: function (props) {
          const ammesse = FASI_PER_TIPOLOGIA[this.tipologia] || [];
          return `fase '${props.value}' non valida per tipologia '${this.tipologia}'. Fasi ammesse: ${ammesse.join(', ')}`;
        },
      },
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