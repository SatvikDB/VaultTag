// Legacy compatibility — now uses the role hierarchy system
// Allows: admin, superadmin
const requireRole = require('./requireRole');
module.exports = requireRole('admin');
