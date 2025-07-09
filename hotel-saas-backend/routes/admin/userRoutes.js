const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/userController');
const { authenticate } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');
const upload = require('../../middlewares/upload');

// 🔐 Middleware: Only accessible to authenticated super_admins
const adminAuth = [authenticate, authorizeRoles('super_admin')];

/**
 * @route   GET /api/admin/user-roles
 * @desc    Get user roles (excluding admin/super_admin)
 */
router.get('/roles-list', adminAuth, userController.getUserRoles);


/**
 * @route   GET /api/admin/user-management
 * @desc    Get all users
 */
router.get('/user-management-list', adminAuth, userController.getUsers);

/**
 * @route   GET /api/admin/user-management/:id
 * @desc    Get user by ID
 */
router.get('/user-management/:id', adminAuth, userController.getUserById);

/**
 * @route   POST /api/admin/user-management
 * @desc    Create a new user (with optional profile image)
 */
router.post('/user-management', adminAuth, upload.single('profile'), userController.createUser);

/**
 * @route   PUT /api/admin/user-management/:id
 * @desc    Update user by ID (with optional profile image)
 */
router.put('/user-management/:id', adminAuth, upload.single('profile'), userController.updateUser);

/**
 * @route   DELETE /api/admin/user-management/:id
 * @desc    Delete user by ID
 */
router.delete('/user-management/:id', adminAuth, userController.deleteUser);

module.exports = router;
