const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check if JWT version matches (for token revocation)
    if (decoded.jwtVersion !== undefined && decoded.jwtVersion !== user.jwtVersion) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      walletAddress: user.walletAddress
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = auth;
