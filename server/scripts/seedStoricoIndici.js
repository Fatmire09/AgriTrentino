// Genera 12 mesi di indici di rischio simulati per ogni campo, con pattern stagionale
// realistico (rischio fitosanitario alto in primavera-estate, climatico alto in inverno).
// Uso: cd ~/AgriTrentino/server && node scripts/seedStoricoIndici.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const GIORNI = 365;

function livelloDaValore(v) {
  if (v >= 66) return 'alto';
  if (v >= 33) return 'medio';
  return 'basso';
}

// Simula rischio fitosanitario: peronospora alta in primavera/estate (mag-ago)
function valoreFitosanitario(giornoAnno) {
  const stagionale = Math.max(0, Math.sin((giornoAnno - 100) / 365 * Math.PI * 2) * 50 + 30);
  const rumore = (Math.random() - 0.5) * 30;
  return Math.max(0, Math.min(100, Math.round(stagionale + rumore)));
}

// Simula rischio climatico: gelate in inverno (nov-feb), stress termico in estate
function valoreClimatico(giornoAnno) {
  const inverno = Math.max(0, Math.cos(giornoAnno / 365 * Math.PI * 2) * 40 + 20);
  const estate = Math.max(0, Math.cos((giornoAnno - 180) / 365 * Math.PI * 2) * 30);
  const rumore = (Math.random() - 0.5) * 25;
  return Math.max(0, Math.min(100, Math.round(inverno + estate + rumore)));
}

function minacciaClimatica(giornoAnno, valore) {
  if (valore < 33) return null;
  // Inverno: gelate. Estate: stress termico
  const mese = Math.floor(giornoAnno / 30);
  if (mese >= 11 || mese <= 2) return 'gelate_tardive';
  if (mese >= 5 && mese <= 8) return 'stress_termico';
  return 'eccesso_umidita';
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB connesso');

  const Field = require('../models/Field');
  const IndiceRischio = require('../models/IndiceRischio');

  const campi = await Field.find();
  if (campi.length === 0) {
    console.error('❌ Nessun campo trovato.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Genero storico per ${campi.length} campi × ${GIORNI} giorni × 2 tipi = ${campi.length * GIORNI * 2} record`);

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  let inseriti = 0;
  for (const campo of campi) {
    const records = [];
    for (let i = GIORNI; i >= 1; i--) {
      const data = new Date(oggi);
      data.setDate(data.getDate() - i);
      const giornoAnno = Math.floor((data - new Date(data.getFullYear(), 0, 0)) / 86400000);

      const vFito = valoreFitosanitario(giornoAnno);
      const vClima = valoreClimatico(giornoAnno);

      records.push({
        appezzamentoId: campo._id,
        data,
        tipoRischio: 'fitosanitario',
        livello: livelloDaValore(vFito),
        valore: vFito,
        minaccia: vFito >= 33 ? 'peronospora' : null,
      });
      records.push({
        appezzamentoId: campo._id,
        data,
        tipoRischio: 'climatico',
        livello: livelloDaValore(vClima),
        valore: vClima,
        minaccia: minacciaClimatica(giornoAnno, vClima),
      });
    }
    // upsert per evitare doppioni
    for (const r of records) {
      await IndiceRischio.findOneAndUpdate(
        { appezzamentoId: r.appezzamentoId, data: r.data, tipoRischio: r.tipoRischio },
        { $set: r },
        { upsert: true }
      );
    }
    inseriti += records.length;
    console.log(`  ✓ Campo "${campo.nome}": ${records.length} record creati`);
  }

  console.log(`✓ Totale inseriti/aggiornati: ${inseriti} record`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});