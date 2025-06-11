// src/routes/uploadDataRoutes.js

const express = require('express');
const router = express.Router();
const uploadDataController = require('../controllers/uploadDataController');
const multer = require('multer');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed!'), false);
    }
  }
});

// Middleware applied to all routes in this router
router.use(authenticate); // Authenticates the user and attaches req.user (JWT payload)
router.use(authorizeRoles('company_admin', 'revenue_manager')); // Authorizes roles

// API 1: Endpoint for file upload, extraction, and preview
router.post(
  '/extract-preview',
  upload.single('file'), // Process the file upload first
  uploadDataController.extractAndPreviewData
);

// API 2: Endpoint for confirming and saving extracted data
router.post(
  '/confirm-save',
  uploadDataController.confirmAndSaveData // No file upload here
);


module.exports = router;