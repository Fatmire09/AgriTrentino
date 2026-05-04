const { validationResult } = require('express-validator');
const Coltura = require('../models/Crop');
const Appezzamento = require('../models/Plot');

const verificaProprietario = (utenteId, appezzamentoId) =>
  Appezzamento.findOne({ _id: appezzamentoId, proprietario: utenteId });

const getColture = async (req, res, next) => {
  try {
    const appezzamento = await verificaProprietario(req.user._id, req.params.appezzamentoId);
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });
    const colture = await Coltura.find({ appezzamento: req.params.appezzamentoId });
    res.json({ success: true, colture });
  } catch (err) {
    next(err);
  }
};

const creaColtura = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const appezzamento = await verificaProprietario(req.user._id, req.params.appezzamentoId);
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });

    const { tipologia, varieta, fase } = req.body;
    const coltura = await Coltura.create({
      tipologia, varieta, fase,
      dataAggiornamento: new Date(),
      appezzamento: req.params.appezzamentoId,
    });
    res.status(201).json({ success: true, coltura });
  } catch (err) {
    next(err);
  }
};

const aggiornaColtura = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const appezzamento = await verificaProprietario(req.user._id, req.params.appezzamentoId);
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });

    const { tipologia, varieta, fase } = req.body;
    const coltura = await Coltura.findOneAndUpdate(
      { _id: req.params.id, appezzamento: req.params.appezzamentoId },
      { tipologia, varieta, fase, dataAggiornamento: new Date() },
      { new: true, runValidators: true }
    );
    if (!coltura) return res.status(404).json({ success: false, message: 'Coltura non trovata' });
    res.json({ success: true, coltura });
  } catch (err) {
    next(err);
  }
};

const eliminaColtura = async (req, res, next) => {
  try {
    const appezzamento = await verificaProprietario(req.user._id, req.params.appezzamentoId);
    if (!appezzamento) return res.status(404).json({ success: false, message: 'Appezzamento non trovato' });

    const coltura = await Coltura.findOneAndDelete({ _id: req.params.id, appezzamento: req.params.appezzamentoId });
    if (!coltura) return res.status(404).json({ success: false, message: 'Coltura non trovata' });
    res.json({ success: true, message: 'Coltura eliminata' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getColture, creaColtura, aggiornaColtura, eliminaColtura };
