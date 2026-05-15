const requireAuth = require('../middleware/auth');
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
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});
router.patch('/me', requireAuth, async (req, res) => {
  const { nome, email, nomeAzienda } = req.body;
  const updates = {};

  if (nome !== undefined) {
    if (!nome.trim()) return res.status(400).json({ error: 'Nome non può essere vuoto' });
    updates.nome = nome.trim();
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Formato email non valido' });
    updates.email = email.toLowerCase().trim();
  }

  if (nomeAzienda !== undefined) {
    updates.nomeAzienda = nomeAzienda.trim() || undefined;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nessun campo da aggiornare' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    return res.status(200).json({
      message: 'Profilo aggiornato con successo',
      user,
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
module.exports = router;
