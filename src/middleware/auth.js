const jwt = require('jsonwebtoken');
const Utente = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Non autenticato' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await Utente.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: "L'utente non esiste più" });
    }
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token non valido o scaduto' });
  }
};

module.exports = { protect };
