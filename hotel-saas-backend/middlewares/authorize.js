exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
     if (req.user.role === 'super_admin') {
      return next();
    }
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};