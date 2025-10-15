const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/admin/transactionController');
const { authenticate } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');


// 🔐 Middleware: Only accessible to authenticated super_admins
const adminAuth = [authenticate, authorizeRoles('super_admin')];

/**
 * @route   GET /api/admin/transaction-management
 * @desc    Get all transaction
 */
router.get('/list', adminAuth, transactionController.getallTransaction);


module.exports = router;
