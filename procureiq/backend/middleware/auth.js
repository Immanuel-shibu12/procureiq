const jwt = require('jsonwebtoken'); const { User } = require('../models');
// Wraps async handlers so errors reach the error middleware
exports.wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Verifies the JWT and loads the user
exports.auth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id); if (!req.user) throw new Error();
    next();
  } catch { res.status(401).json({ message: 'Please log in again' }); }
};
// Role-based access control enforced on the server
exports.allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Your role is not permitted to do this' });
