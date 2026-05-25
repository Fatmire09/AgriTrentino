const Field = require('../models/Field');
const Coltura = require('../models/Coltura');
const Notifica = require('../models/Notifica');
const rischioFitosanitarioService = require('./rischioFitosanitarioService');
const rischioClimaticoService = require('./rischioClimaticoService');

// ────────────────────────────────────────────────────────────────────────────────
// SERVIZIO NOTIFICHE — US37
// Valuta gli indici di rischio (fitosanitario + climatico) di tutti i campi e
// genera una notifica quando il livello è "alto". Dedup: non crea una nuova
// notifica se ne esiste già una NON letta per lo stesso campo + tipo di rischio.
// ────────────────────────────────────────────────────────────────────────────────

async function creaNotificaSeNecessario({ field, tipoRischio, minaccia, messaggio }) {
  // Dedup: se c'è già una notifica non letta per questo campo+tipo, non duplicare
  const esistente = await Notifica.findOne({
    appezzamentoId: field._id,
    tipoRischio,
    letta: false,
  });
  if (esistente) return null;

  return Notifica.create({
    userId: field.ownerId,
    appezzamentoId: field._id,
    campoNome: field.nome,
    tipoRischio,
    minaccia: minaccia || null,
    livello: 'alto',
    messaggio,
  });
}

// Valuta tutti i campi e genera le notifiche necessarie (usato dal cron)
async function generaNotifiche() {
  const campi = await Field.find({});
  let create = 0;
  let errori = 0;

  for (const field of campi) {
    try {
      const coltura = await Coltura.findOne({ appezzamentoId: field._id }).sort({ createdAt: -1 });

      // Indice fitosanitario
      const fito = await rischioFitosanitarioService.calcolaRischioFitosanitario(coltura);
      if (fito && fito.livello === 'alto') {
        const n = await creaNotificaSeNecessario({
          field,
          tipoRischio: 'fitosanitario',
          minaccia: fito.patologia,
          messaggio: `Rischio fitosanitario ALTO (${fito.patologia}) sul campo "${field.nome}".`,
        });
        if (n) create++;
      }

      // Indice climatico
      const clima = await rischioClimaticoService.calcolaRischioClimatico(field, coltura);
      if (clima && clima.livello === 'alto') {
        const n = await creaNotificaSeNecessario({
          field,
          tipoRischio: 'climatico',
          minaccia: clima.minaccia,
          messaggio: `Rischio climatico ALTO (${clima.minaccia}) sul campo "${field.nome}".`,
        });
        if (n) create++;
      }
    } catch (err) {
      errori++;
    }
  }

  return { totaleCampi: campi.length, create, errori };
}

module.exports = {
  generaNotifiche,
  creaNotificaSeNecessario,
};