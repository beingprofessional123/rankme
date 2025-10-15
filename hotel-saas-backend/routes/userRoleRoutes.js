// routes/userRolesRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize'); // Ensure this path is correct
const userRolesController = require('../controllers/userRolesController'); // Ensure this path is correct

// Apply authentication and authorization middleware to all routes in this file
// Only 'company_admin' and 'super_admin' (due to super_admin bypass in authorizeRoles)
// will be able to access these routes.
router.use(authenticate);
router.use(authorizeRoles('company_admin','revenue_manager','general_manager','analyst')); // You might want to add 'super_admin' explicitly here if you remove the bypass in authorizeRoles later.

// Route to fetch role names (excluding super_admin and company_admin)
router.get('/roles/list', userRolesController.getUserRoles);

// Route to fetch list of users (excluding super_admin and company_admin)
router.get('/users/list', userRolesController.getUsersByRoleExclusion);

// Route to create a new user
router.post('/users/create', userRolesController.createUser);

// Route to get a single user by ID (for prefill/edit)
router.get('/users/:id', userRolesController.getUserById);

// Route to update an existing user
router.put('/users/:id', userRolesController.updateUser);

// Route to delete a user
router.delete('/users/:id', userRolesController.deleteUser);

module.exports = router;