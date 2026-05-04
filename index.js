const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(express.json());

app.get('/test', (req, res) => res.json({ ok: true }));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/agritrentino')
  .then(() => console.log('Connesso a MongoDB!'))
  .catch((err) => console.log('Errore di connessione:', err));

app.listen(3000, () => console.log('Server avviato su http://localhost:3000'));
