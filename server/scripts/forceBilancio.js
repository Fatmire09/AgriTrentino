// One-off helper: forza il calcolo del bilancio idrico per tutti i campi
// Usage: cd server && node scripts/forceBilancio.js [YYYY-MM-DD]
//   Argomento opzionale: data per cui calcolare (default = oggi)

require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const bilancioIdricoService = require('../services/bilancioIdricoService');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI non trovato nel .env');
    process.exit(1);
  }

  console.log('🔌 Connessione a MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connesso');

  const dataParam = process.argv[2];
  const data = dataParam ? new Date(dataParam) : new Date();
  console.log(`📅 Calcolo bilancio per: ${data.toISOString().slice(0, 10)}`);

  const risultato = await bilancioIdricoService.calcolaBilancioTuttiCampi(data);

  console.log('');
  console.log('📊 Risultati:');
  console.log(`   Campi totali:           ${risultato.totaleCampi}`);
  console.log(`   Calcolati con successo: ${risultato.calcolati}`);
  console.log(`   Errori:                 ${risultato.errori}`);

  if (risultato.dettagli && risultato.dettagli.length > 0) {
    console.log('');
    console.log('⚠️  Dettagli errori:');
    for (const e of risultato.dettagli) {
      console.error(`   - "${e.nome}" (${e.campoId}): ${e.errore}`);
    }
  }

  await mongoose.disconnect();
  console.log('');
  console.log('✅ Fatto.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});
