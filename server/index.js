require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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

module.exports = app;
