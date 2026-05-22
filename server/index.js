require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const fieldsRouter = require('./routes/fields');
const colturaRoutes = require('./routes/colture');
const meteoRoutes = require('./routes/meteo');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/', indexRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/fields', fieldsRouter);
app.use('/api/v1/fields/:fieldId/colture', colturaRoutes);
app.use('/api/v1/fields/:fieldId/meteo', meteoRoutes);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritrentino')
  .then(() => console.log('MongoDB connesso'))
  .catch(err => console.error('Errore connessione MongoDB:', err));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
