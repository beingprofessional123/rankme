const express = require('express');
const router = express.Router();
const setupWizardController = require('../controllers/setupWizardController');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin','revenue_manager','general_manager','analyst')); 

// Route for setup
router.post('/hotels', setupWizardController.createHotel);
router.post('/rate-categories', setupWizardController.addRateCategories);
router.get('/get-rate-categories', setupWizardController.getRateCategories);
router.post('/delete-rate-categories', setupWizardController.deleteRateCategories);

router.post('/room-types', setupWizardController.addRoomTypes);
router.get('/get-room-types', setupWizardController.getRoomTypes);
router.post('/delete-room-types', setupWizardController.deleteRoomTypes);



module.exports = router;
