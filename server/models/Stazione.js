const mongoose = require('mongoose');

// Modello Stazione meteo MeteoTrentino (US25)
// Cache locale della lista stazioni fornita da:
// http://dati.meteotrentino.it/service.asmx/listaStazioniGeoJson
// (497 stazioni circa, aggiornate periodicamente)

const stazioneSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Esempio: "T0405"
    },
    nome: {
      type: String,
      required: true,
      // Esempio: "Ala (Maso Le Pozze)"
    },
    quotaMt: {
      type: Number,
      default: null,
    },
    latitudine: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
      index: true,
    },
    longitudine: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
      index: true,
    },
    attiva: {
      type: Boolean,
      default: true,
      // false se la stazione è dismessa
    },
    inizioMonitoraggio: { type: Date, default: null },
    fineMonitoraggio: { type: Date, default: null },
    ultimoFetchOk: { type: Date, default: null },
    // Quando è stata cacheata l'intera lista (per sapere quando rinfrescarla)
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stazione', stazioneSchema);