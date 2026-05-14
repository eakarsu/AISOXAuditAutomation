// RBAC middleware: requireRole('admin'), requireRole('auditor'), requireRole('management')
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role || 'auditor';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { requireRole };
