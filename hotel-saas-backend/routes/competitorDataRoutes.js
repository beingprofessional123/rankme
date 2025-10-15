const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const competitorDataController = require('../controllers/competitorDataController');

// Apply middlewares to all competitorData routes
router.use(authenticate);
router.use(authorizeRoles('company_admin', 'revenue_manager', 'general_manager', 'analyst'));

// Get all competitorDatas (optionally filter by company_id via query param)
router.get('/list', competitorDataController.getAllCompetitorData);

module.exports = router;
