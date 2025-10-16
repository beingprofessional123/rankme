const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');
const adminProfileController = require('../../controllers/admin/adminProfileController');
const multer = require('multer');

// --------------------
// Ensure uploads/profile folder exists
// --------------------
const uploadPath = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// --------------------
// Multer storage configuration
// --------------------
const storage = multer.memoryStorage(); // Memory storage works with controller saveProfileFile function
const upload = multer({ storage });

// --------------------
// Middleware for admin routes
// --------------------
const adminAuth = [authenticate, authorizeRoles('super_admin')];

// --------------------
// Routes
// --------------------

// Get admin profile
router.get('/my-profile', adminAuth, adminProfileController.getProfile);

// Update admin profile with file upload
router.put(
    '/my-profile',
    adminAuth,
    upload.single('profile'), // 'profile' must match frontend FormData input name
    adminProfileController.updateProfile
);

// Change password
router.put('/change-password', adminAuth, adminProfileController.changePassword);

module.exports = router;
