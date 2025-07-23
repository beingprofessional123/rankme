const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const strocrReportController = require('../controllers/strocrReportController');

// Apply middlewares to all strocrReport routes
router.use(authenticate);
router.use(authorizeRoles('company_admin', 'revenue_manager', 'general_manager', 'analyst'));

// Get all strocrReports (optionally filter by company_id via query param)
router.get('/list', strocrReportController.getAllstrocrReports);

module.exports = router;
