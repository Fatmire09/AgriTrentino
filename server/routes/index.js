const express = require('express');
const router = express.Router();

// GET / — landing page info (US1)
router.get('/', (req, res) => {
  res.json({
    platform: 'AgriTrentino',
    version: '1.0.0',
    description: 'Piattaforma digitale per la filiera agricola trentina',
    objectives: [
      'Connettere agricoltori e acquirenti',
      'Tracciare la filiera agroalimentare',
      'Semplificare la burocrazia agricola',
      'Valorizzare i prodotti locali del Trentino',
    ],
  });
});

module.exports = router;
