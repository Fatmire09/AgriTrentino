const { Router } = require('express');
const { body } = require('express-validator');
const { getColture, creaColtura, aggiornaColtura, eliminaColtura } = require('../controllers/crop.controller');

const router = Router({ mergeParams: true });

const validazioneColtura = [
  body('tipologia')
    .isIn(['Melo', 'Vite', 'Piccoli Frutti', 'Pero', 'Ciliegio', 'Altro'])
    .withMessage('Tipologia coltura non valida'),
];

router.get('/', getColture);
router.post('/', validazioneColtura, creaColtura);
router.put('/:id', validazioneColtura, aggiornaColtura);
router.delete('/:id', eliminaColtura);

module.exports = router;
