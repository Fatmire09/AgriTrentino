const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Utente = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const registra = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { nome, cognome, email, password, nomeAzienda, sedeAzienda } = req.body;

    const esistente = await Utente.findOne({ email });
    if (esistente) {
      return res.status(409).json({ success: false, message: 'Email già in uso' });
    }

    const utente = await Utente.create({ nome, cognome, email, password, nomeAzienda, sedeAzienda });
    const token = signToken(utente._id);
    res.status(201).json({ success: true, token, utente });
  } catch (err) {
    next(err);
  }
};

const accedi = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const utente = await Utente.findOne({ email }).select('+password');
    if (!utente || !(await utente.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email o password non validi' });
    }

    const token = signToken(utente._id);
    res.json({ success: true, token, utente });
  } catch (err) {
    next(err);
  }
};

module.exports = { registra, accedi };
