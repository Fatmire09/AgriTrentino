const mongoose = require('mongoose');

const stateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const getHealth = (req, res) => {
  const readyState = mongoose.connection.readyState;
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    server: 'ok',
    database: stateLabels[readyState] || 'unknown',
    mongooseState: readyState,
  });
};

module.exports = { getHealth };
