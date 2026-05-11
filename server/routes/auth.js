const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  const { email, password, nome, nomeAzienda } = req.body;

  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'Email, password e nome sono obbligatori' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato email non valido' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
  }

  if (password.length > 32) {
    return res.status(400).json({ error: 'La password non può superare 32 caratteri' });
  }

  try {
    const user = new User({ email, password, nome, nomeAzienda: nomeAzienda || undefined });
    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();
    return res.status(201).json({
      message: 'Account creato con successo',
      user: userWithoutPassword,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' ? 'Email già registrata' : 'Nome azienda già in uso';
      return res.status(409).json({ error: message });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;
