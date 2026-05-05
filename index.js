const express = require('express');
const mongoose = require('mongoose');
const tokenChecker = require('./tokenChecker');

const app = express();

app.use(express.json());

app.get('/test', (req, res) => res.json({ ok: true }));

// Rotte pubbliche
app.use('/api/v1/auth', require('./routes/auth'));

// Middleware di autenticazione - protegge tutto quello che viene dopo
app.use(tokenChecker);

// Rotte protette (da aggiungere qui sotto)

app.use(express.static('public'));

mongoose.connect(process.env.DB_URL)
  .then(() => console.log('Connesso a MongoDB!'))
  .catch((err) => console.log('Errore di connessione:', err));

app.listen(3000, () => console.log('Server avviato su http://localhost:3000'));