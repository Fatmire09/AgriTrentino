const { Router } = require('express');
const { body } = require('express-validator');
const { registra, accedi } = require('../controllers/auth.controller');

const router = Router();

router.post(
  '/registra',
  [
    body('nome').trim().notEmpty().withMessage('Il nome è obbligatorio'),
    body('cognome').trim().notEmpty().withMessage('Il cognome è obbligatorio'),
    body('email').isEmail().withMessage('Email non valida'),
    body('password').isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri'),
  ],
  registra
);

router.post(
  '/accedi',
  [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').notEmpty().withMessage('La password è obbligatoria'),
  ],
  accedi
);

module.exports = router;
