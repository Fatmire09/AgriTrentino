require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const fieldsRouter = require('./routes/fields');
const colturaRoutes = require('./routes/colture');
const meteoRoutes = require('./routes/meteo');
const bilancioRoutes = require('./routes/bilancio');
const meteoScheduler = require('./services/meteoScheduler');
const fenologiaRoutes = require('./routes/fenologia');
const indiciRoutes = require('./routes/indici');
const notificheRoutes = require('./routes/notifiche');
const indiciStoricoRoutes = require('./routes/indiciStorico');
const interventiRoutes = require('./routes/interventi');
const dashboardRoutes = require('./routes/dashboard');
const consumiRoutes = require('./routes/consumi');
const simulatoreRoutes = require('./routes/simulatore');

const app = express();
const PORT = process.env.PORT || 3001;

// US61: origine CORS configurabile via env (default = frontend Vite locale)
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(compression()); // US60 (D1 RNF01): gzip delle response per ridurre il tempo di trasferimento
app.use(express.json());

// US64: health check per il monitoraggio su Render (stato app + connessione DB)
app.get('/api/v1/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/', indexRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/fields', fieldsRouter);
app.use('/api/v1/fields/:fieldId/colture', colturaRoutes);
app.use('/api/v1/fields/:fieldId/meteo', meteoRoutes);
// US27: endpoint meteo globali (non scoped a un singolo campo) — usa lo stesso router
app.use('/api/v1/meteo', meteoRoutes);
app.use('/api/v1/fields/:fieldId/bilancio-idrico', bilancioRoutes);
app.use('/api/v1/fields/:fieldId/fenologia', fenologiaRoutes);
app.use('/api/v1/fields/:fieldId/indici', indiciRoutes);
app.use('/api/v1/notifiche', notificheRoutes);
app.use('/api/v1/fields/:fieldId/indici', indiciStoricoRoutes);
app.use('/api/v1/fields/:fieldId/interventi', interventiRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/fields/:fieldId/consumi', consumiRoutes);
app.use('/api/v1/fields/:fieldId/simulatore', simulatoreRoutes);
// US65: avvio del server solo quando index.js è eseguito direttamente.
// Durante i test (require di app via supertest) NON connettiamo il DB reale,
// NON apriamo la porta e NON avviamo i cron.
if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritrentino')
    .then(() => console.log('MongoDB connesso'))
    .catch(err => console.error('Errore connessione MongoDB:', err));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // US27: avvia lo scheduler meteo periodico
    meteoScheduler.avvia();
    // US31: avvia lo scheduler bilancio idrico
    meteoScheduler.avviaCronBilancio();
    // US32: avvia lo scheduler fenologia
    meteoScheduler.avviaCronFenologia();
    // US37: avvia lo scheduler notifiche
    meteoScheduler.avviaCronNotifiche();
  });
}

module.exports = app;
