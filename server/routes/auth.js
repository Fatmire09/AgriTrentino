const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
      return res.status(409).json({ error: message, field });
    }
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatorie' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    return res.status(200).json({
      message: 'Login effettuato con successo',
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logout effettuato con successo' });
});
module.exports = router;
