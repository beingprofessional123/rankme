const express = require('express');
const router = express.Router();
const planController = require('../../controllers/admin/planController');
const { authenticate } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');


// 🔐 Middleware: Only accessible to authenticated super_admins
const adminAuth = [authenticate, authorizeRoles('super_admin')];

/**
 * @route   GET /api/admin/plan-management
 * @desc    Get all Plans
 */
router.get('/plan-management-list', adminAuth, planController.getPlans);

/**
 * @route   GET /api/admin/plan-management/:id
 * @desc    Get Plan by ID
 */
router.get('/plan-management/:id', adminAuth, planController.getPlanById);

/**
 * @route   POST /api/admin/plan-management
 * @desc    Create a new Plan (with optional profile image)
 */
router.post('/plan-management', adminAuth, planController.createPlan);

/**
 * @route   PUT /api/admin/plan-management/:id
 * @desc    Update Plan by ID (with optional profile image)
 */
router.put('/plan-management/:id', adminAuth, planController.updatePlan);

/**
 * @route   DELETE /api/admin/plan-management/:id
 * @desc    Delete Plan by ID
 */
router.delete('/plan-management/:id', adminAuth, planController.deletePlan);

module.exports = router;
