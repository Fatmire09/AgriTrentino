const { validationResult } = require('express-validator');
const Utente = require('../models/User');

const getProfilo = (req, res) => {
  res.json({ success: true, utente: req.user });
};

const aggiornaProfilo = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { nome, cognome, telefono, nomeAzienda, sedeAzienda } = req.body;
    const utente = await Utente.findByIdAndUpdate(
      req.user._id,
      { nome, cognome, telefono, nomeAzienda, sedeAzienda },
      { new: true, runValidators: true }
    );
    res.json({ success: true, utente });
  } catch (err) {
    next(err);
  }
};

const cambiaPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { passwordAttuale, nuovaPassword } = req.body;
    const utente = await Utente.findById(req.user._id).select('+password');

    if (!(await utente.comparePassword(passwordAttuale))) {
      return res.status(401).json({ success: false, message: 'Password attuale non corretta' });
    }

    utente.password = nuovaPassword;
    await utente.save();
    res.json({ success: true, message: 'Password aggiornata' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfilo, aggiornaProfilo, cambiaPassword };
