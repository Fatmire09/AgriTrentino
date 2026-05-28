// US63 (GDPR – diritto all'oblio): cancellazione a cascata dei dati associati.
// Quando si elimina un appezzamento o un account, vanno rimossi anche tutti i dati
// collegati per non lasciare informazioni personali orfane nel database.
const Field = require('../models/Field');
const User = require('../models/User');
const Coltura = require('../models/Coltura');
const Intervento = require('../models/Intervento');
const IndiceRischio = require('../models/IndiceRischio');
const DatiMeteo = require('../models/DatiMeteo');
const BilancioIdricoGiornaliero = require('../models/BilancioIdricoGiornaliero');
const Notifica = require('../models/Notifica');

// Elimina tutti i dati associati a un appezzamento (senza eliminare il Field stesso).
async function eliminaDatiCampo(appezzamentoId) {
  await Promise.all([
    Coltura.deleteMany({ appezzamentoId }),
    Intervento.deleteMany({ appezzamentoId }),
    IndiceRischio.deleteMany({ appezzamentoId }),
    DatiMeteo.deleteMany({ appezzamentoId }),
    BilancioIdricoGiornaliero.deleteMany({ appezzamentoId }),
    Notifica.deleteMany({ appezzamentoId }),
  ]);
}

// Elimina un appezzamento e tutti i suoi dati associati.
async function eliminaCampo(appezzamentoId) {
  await eliminaDatiCampo(appezzamentoId);
  await Field.deleteOne({ _id: appezzamentoId });
}

// Diritto all'oblio: elimina un utente, tutti i suoi appezzamenti e i dati collegati.
async function eliminaUtente(userId) {
  const campi = await Field.find({ ownerId: userId }).select('_id');
  for (const c of campi) {
    await eliminaDatiCampo(c._id);
  }
  await Field.deleteMany({ ownerId: userId });
  await Notifica.deleteMany({ userId }); // eventuali notifiche non legate a un campo
  await User.deleteOne({ _id: userId });
}

module.exports = { eliminaDatiCampo, eliminaCampo, eliminaUtente };
