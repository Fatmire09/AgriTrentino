const mongoose = require('mongoose');

// US37: notifica in-app generata quando un indice di rischio supera la soglia critica (livello "alto")
const notificaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    appezzamentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: true,
    },
    campoNome: { type: String, default: null },
    tipoRischio: {
      type: String,
      enum: ['fitosanitario', 'climatico'],
      required: true,
    },
    minaccia: { type: String, default: null }, // es. 'peronospora', 'gelate'
    livello: { type: String, required: true }, // attualmente solo 'alto'
    messaggio: { type: String, required: true },
    letta: { type: Boolean, default: false }, // US39: segna come letta
  },
  { timestamps: true }
);

// Recupero veloce delle notifiche di un utente, dalla più recente
notificaSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notifica', notificaSchema);