const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const scrapedHotelRoomDetailController = require('../controllers/scrapedHotelRoomDetailController');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const { signupValidation, loginValidation } = require('../validators/authValidator');
const { validationResult } = require('express-validator');


// SIGNUP
router.post('/signup', signupValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  authController.signup(req, res);
});

// LOGIN
router.post('/login', loginValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  authController.login(req, res);
});

router.get('/test', (req, res) => {
  res.send('API is working');
});

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/country-list', authController.getAllCountries);

// Script
router.get('/scraped-hotel-room-details', scrapedHotelRoomDetailController.getScrapedHotelDetail);


// // SuperAdmin Routes
// router.get('/admin/dashboard', authenticate, authorizeRoles('super_admin'), (req, res) => {
//   res.json({ message: 'Welcome Super Admin!' });
// });

// //  revenue_manager or company_admin
// router.get('/pricing-calendar', authenticate, authorizeRoles('revenue_manager', 'company_admin'), (req, res) => {
//   res.json({ message: 'Welcome Revenue Manager or Company Admin!' });
// });



module.exports = router;
