const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const { settingsController, upload } = require('../controllers/settingsController'); // <--- CHANGE IS HERE


// Middleware for this route group
router.use(authenticate);

// Route to fetch subscriptions
router.get('/general-settings', settingsController.getGeneralSettingsDetail);
router.post(
  '/general-settings/update',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'companyLogoUrl', maxCount: 1 }
  ]),
  settingsController.updateGeneralSettingsDetail
);
router.post('/change-password', settingsController.updatePassword);

module.exports = router;
