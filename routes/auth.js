const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utente = require('../models/utente');

// REGISTRAZIONE
router.post('/registrazione', async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    const passwordCriptata = await bcrypt.hash(password, 10);
    const utente = new Utente({ nome, email, password: passwordCriptata });
    await utente.save();
    res.status(201).json({ messaggio: 'Utente registrato con successo!' });
  } catch (err) {
    res.status(400).json({ errore: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const utente = await Utente.findOne({ email });
    if (!utente) return res.status(400).json({ errore: 'Utente non trovato' });
    const valida = await bcrypt.compare(password, utente.password);
    if (!valida) return res.status(400).json({ errore: 'Password errata' });
    const token = jwt.sign({ id: utente._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, nome: utente.nome });
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

module.exports = router;