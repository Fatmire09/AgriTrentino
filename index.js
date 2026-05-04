const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/agritrentino')
  .then(() => console.log('Connesso a MongoDB!'))
  .catch((err) => console.log('Errore di connessione:', err));
  