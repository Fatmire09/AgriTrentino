const express = require('express');
const mongoose = require('mongoose');
const tokenChecker = require('./tokenChecker');

const app = express();

app.use(express.json());

// Pagine pubbliche
app.use(express.static('public'));

// Rotte API pubbliche
app.use('/api/v1/auth', require('./routes/auth'));

// Da qui in poi tutto è protetto
app.use(tokenChecker);

// Rotte API protette (da aggiungere qui sotto)

mongoose.connect(process.env.DB_URL)
  .then(() => console.log('Connesso a MongoDB!'))
  .catch((err) => console.log('Errore di connessione:', err));

app.listen(3000, () => console.log('Server avviato su http://localhost:3000'));