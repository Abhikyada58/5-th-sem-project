const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check cookies for token, or Authorization header
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB to ensure they still exist and check status
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
    }

    // Validate account status
    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({ message: `Account is ${user.accountStatus.toLowerCase()}` });
    }

    // Validate account expiry
    if (user.accountExpiresAt && new Date() > user.accountExpiresAt) {
      return res.status(403).json({ message: 'Account has expired' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // We fetched req.user in protect(), so role is trusted from DB
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
