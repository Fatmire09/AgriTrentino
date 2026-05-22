const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome appezzamento obbligatorio'],
    trim: true,
  },
  latitudine: {
    type: Number,
    required: [true, 'Latitudine obbligatoria'],
    min: [-90, 'Latitudine deve essere compresa tra -90 e 90'],
    max: [90, 'Latitudine deve essere compresa tra -90 e 90'],
  },
  longitudine: {
    type: Number,
    required: [true, 'Longitudine obbligatoria'],
    min: [-180, 'Longitudine deve essere compresa tra -180 e 180'],
    max: [180, 'Longitudine deve essere compresa tra -180 e 180'],
  },
  superficie: {
    type: Number,
    required: [true, 'Superficie obbligatoria'],
    min: [0.0001, 'Superficie deve essere positiva'],
  },
  pendenza: {
    type: Number,
    min: [0, 'Pendenza deve essere compresa tra 0 e 100'],
    max: [100, 'Pendenza deve essere compresa tra 0 e 100'],
  },
  coltura: {
    type: String,
    trim: true,
  },
  esposizione: {
    type: String,
    trim: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // US25: code della stazione MeteoTrentino assegnata
  stazioneAssegnataCode: {
    type: String,
    default: null,
  },
  // US28: tracking sincronizzazioni meteo
  ultimoTentativoSync: { type: Date, default: null },
  ultimoSuccessoSync: { type: Date, default: null },
  ultimoTentativoRiuscito: { type: Boolean, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Field', fieldSchema);
