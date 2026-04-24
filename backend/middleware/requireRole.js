/**
 * Role-based access control middleware.
 * Usage: requireRole('admin')         — allows admin + superadmin
 *        requireRole('seller')        — allows seller + admin + superadmin
 *        requireRole('superadmin')    — superadmin only
 *
 * The hierarchy is: superadmin > admin > seller > buyer
 */

const ROLE_HIERARCHY = {
  superadmin: 4,
  admin: 3,
  seller: 2,
  buyer: 1
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;

    // Find the minimum required level from allowed roles
    const minLevel = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r] || 0));

    // User's level must be >= the minimum required level
    if (userLevel >= minLevel) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. ${allowedRoles.join(' or ')} privileges required.`
    });
  };
};

module.exports = requireRole;
