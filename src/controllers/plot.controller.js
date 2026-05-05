const { validationResult } = require('express-validator');
const Appezzamento = require('../models/Plot');

const getAppezzamenti = async (req, res, next) => {
  try {
    const appezzamenti = await Appezzamento.find({ proprietario: req.user._id });
    res.json({ success: true, appezzamenti });
  } catch (err) {
    next(err);
  }
};

const getAppezzamento = async (req, res, next) => {
  try {
    const appezzamento = await Appezzamento.findOne({ _id: req.params.id, proprietario: req.user._id });
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });
    res.json({ success: true, appezzamento });
  } catch (err) {
    next(err);
  }
};

const creaAppezzamento = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const { denominazione, latitudine, longitudine, superficieHa, pendenzaPerc, orientamento } = req.body;
    const appezzamento = await Appezzamento.create({
      denominazione, latitudine, longitudine, superficieHa, pendenzaPerc, orientamento,
      proprietario: req.user._id,
    });
    res.status(201).json({ success: true, appezzamento });
  } catch (err) {
    next(err);
  }
};

const aggiornaAppezzamento = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const { denominazione, latitudine, longitudine, superficieHa, pendenzaPerc, orientamento } = req.body;
    const appezzamento = await Appezzamento.findOneAndUpdate(
      { _id: req.params.id, proprietario: req.user._id },
      { denominazione, latitudine, longitudine, superficieHa, pendenzaPerc, orientamento },
      { new: true, runValidators: true }
    );
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });
    res.json({ success: true, appezzamento });
  } catch (err) {
    next(err);
  }
};

const eliminaAppezzamento = async (req, res, next) => {
  try {
    const appezzamento = await Appezzamento.findOneAndDelete({ _id: req.params.id, proprietario: req.user._id });
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });
    res.json({ success: true, message: 'Appezzamento eliminato' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAppezzamenti, getAppezzamento, creaAppezzamento, aggiornaAppezzamento, eliminaAppezzamento };
