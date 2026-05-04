const { Router } = require('express');
const { body } = require('express-validator');
const { getProfilo, aggiornaProfilo, cambiaPassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

const router = Router();

router.use(protect);

router.get('/me', getProfilo);

router.put(
  '/me',
  [
    body('nome').optional().trim().notEmpty().withMessage('Il nome non può essere vuoto'),
    body('cognome').optional().trim().notEmpty().withMessage('Il cognome non può essere vuoto'),
  ],
  aggiornaProfilo
);

router.put(
  '/me/password',
  [
    body('passwordAttuale').notEmpty().withMessage('La password attuale è obbligatoria'),
    body('nuovaPassword').isLength({ min: 8 }).withMessage('La nuova password deve avere almeno 8 caratteri'),
  ],
  cambiaPassword
);

module.exports = router;
