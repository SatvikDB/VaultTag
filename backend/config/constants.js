module.exports = {
  CATEGORIES: ['Footwear', 'Clothing', 'Artwork', 'Accessories', 'Electronics'],
  STATUSES: ['unminted', 'active', 'redeemed'],
  ROLES: ['superadmin', 'admin', 'seller', 'buyer'],
  JWT_EXPIRY: '7d',
  BCRYPT_SALT_ROUNDS: 12,
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  }
};
