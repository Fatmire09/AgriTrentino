const { Router } = require('express');
const { body } = require('express-validator');
const {
  getAppezzamenti, getAppezzamento, creaAppezzamento, aggiornaAppezzamento, eliminaAppezzamento,
} = require('../controllers/plot.controller');
const { protect } = require('../middleware/auth');
const coltureRoutes = require('./crop.routes');

const router = Router();

router.use(protect);

const validazioneAppezzamento = [
  body('denominazione').trim().notEmpty().withMessage('La denominazione è obbligatoria'),
  body('latitudine').isFloat({ min: -90, max: 90 }).withMessage('Latitudine non valida'),
  body('longitudine').isFloat({ min: -180, max: 180 }).withMessage('Longitudine non valida'),
  body('superficieHa').isFloat({ min: 0 }).withMessage('La superficie deve essere un numero positivo'),
];

router.get('/', getAppezzamenti);
router.get('/:id', getAppezzamento);
router.post('/', validazioneAppezzamento, creaAppezzamento);
router.put('/:id', validazioneAppezzamento, aggiornaAppezzamento);
router.delete('/:id', eliminaAppezzamento);

router.use('/:appezzamentoId/colture', coltureRoutes);

module.exports = router;
