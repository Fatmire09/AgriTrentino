const mongoose = require('mongoose');

// Modello BilancioIdricoGiornaliero (US31)
// Riferimento UML D2: classe BilancioIdricoGiornaliero
// (data, precipitazioniMm, umiditaSuoloPerc, bilancio + metodo calcolaBilancio())
//
// Ogni record rappresenta il bilancio idrico calcolato per un appezzamento in un singolo giorno.
// Viene creato dal cron job giornaliero (US31 + US32) o on-demand dal service.

const bilancioSchema = new mongoose.Schema(
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
      // Giorno di riferimento (sempre alle 00:00 del giorno locale)
    },
    precipitazioniMm: {
      type: Number,
      required: true,
      min: 0,
      // Totale precipitazioni del giorno (somma DatiMeteo)
    },
    evapotraspirazioneMm: {
      type: Number,
      required: true,
      min: 0,
      // ETc = ET0 × Kc (calcolato con Hargreaves-Samani + coefficiente coltura)
    },
    bilancio: {
      type: Number,
      required: true,
      // P - ETc (può essere negativo se ET > pioggia)
    },
    riservaIdricaMm: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
      // Accumulato giornaliero, clampato 0-150 (capacità di campo per vite in Trentino)
    },
    umiditaSuoloPerc: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      // (riservaIdrica / capacitaCampo) × 100
    },
  },
  { timestamps: true }
);

// Indice composito per query frequenti
bilancioSchema.index({ appezzamentoId: 1, data: -1 });

// Unicità: un solo bilancio per giorno per appezzamento (idempotenza del cron)
bilancioSchema.index({ appezzamentoId: 1, data: 1 }, { unique: true });

module.exports = mongoose.model('BilancioIdricoGiornaliero', bilancioSchema);