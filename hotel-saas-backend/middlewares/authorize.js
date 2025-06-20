// auth/authorizeRoles.js
const db = require('../models'); // Import your models

exports.authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => { // Make the middleware async
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }

    try {
      // Fetch the user from the DB and include their Role
      const userWithRole = await db.User.findByPk(req.user.id, {
        include: {
          model: db.Role,
          attributes: ['name'] // Only need the role name
        }
      });

      if (!userWithRole || !userWithRole.Role || !userWithRole.Role.name) {
        return res.status(403).json({ message: 'Forbidden: User role information not found.' });
      }

      const userRoleName = userWithRole.Role.name;

      // Super Admin bypass
      if (userRoleName === 'super_admin') {
        return next();
      }

      // Check if the user's role is in the allowed roles list
      if (!allowedRoles.includes(userRoleName)) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      // Optionally, you can update req.user to include the full user object with role name
      // This is helpful if downstream middleware or routes need the role name directly.
      req.user = userWithRole; // Overwrite req.user with the full user object from DB

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ message: 'Authorization failed due to internal error.' });
    }
  };
};