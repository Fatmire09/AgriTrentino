const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const utenteRoutes = require('./user.routes');
const appezzamentoRoutes = require('./plot.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/utenti', utenteRoutes);
router.use('/appezzamenti', appezzamentoRoutes);

module.exports = router;
