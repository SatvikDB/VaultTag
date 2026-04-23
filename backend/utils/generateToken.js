const jwt = require('jsonwebtoken');
const { JWT_EXPIRY } = require('../config/constants');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      jwtVersion: user.jwtVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

module.exports = generateToken;
