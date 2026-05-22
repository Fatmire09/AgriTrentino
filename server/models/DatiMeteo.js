const mongoose = require('mongoose');

// Modello DatiMeteo (US25)
// Riferimento UML D2: classe DatiMeteo (timestamp, temperaturaC, umiditaPerc, precipitazioniMm)
// Estensione: aggiungiamo riferimento all'appezzamento e alla stazione che ha generato il dato

const datiMeteoSchema = new mongoose.Schema(
  {
    appezzamentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: true,
      index: true,
    },
    stazioneCode: {
      type: String,
      required: true,
      // Riferimento al code della Stazione (non FK rigida per resilienza)
    },
    stazioneNome: {
      type: String,
      default: null,
      // Cached per non dover fare populate (la stazione raramente cambia nome)
    },
    timestamp: {
      type: Date,
      required: true,
      // Quando la rilevazione è stata fatta dalla stazione
    },
    temperaturaC: {
      type: Number,
      default: null,
      // Alcune stazioni non hanno sensore di temperatura
    },
    umiditaPerc: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
      // Umidità relativa atmosferica 
    },
    precipitazioniMm: {
      type: Number,
      default: null,
      min: 0,
      // Pioggia cumulata
    },
  },
  { timestamps: true }
);

// Indice composito per query frequenti: "ultimi N dati di un appezzamento"
datiMeteoSchema.index({ appezzamentoId: 1, timestamp: -1 });

// Indice di unicità: evita doppioni dello stesso timestamp per lo stesso appezzamento
datiMeteoSchema.index({ appezzamentoId: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model('DatiMeteo', datiMeteoSchema);