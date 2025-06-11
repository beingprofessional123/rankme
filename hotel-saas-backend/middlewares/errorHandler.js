// src/middlewares/errorHandler.js

const multer = require('multer'); // Import multer to check for MulterError

const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error('Global Error Handler caught an error:', err);

  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: `File upload error: ${err.message}`,
      code: err.code // Multer errors often have a 'code' like 'LIMIT_FILE_SIZE'
    });
  }

  // Handle errors from Multer's fileFilter (like the one you're seeing)
  // This is a generic Error object thrown by the fileFilter callback
  if (err.message === 'Only CSV and Excel files are allowed!') {
    return res.status(400).json({
      message: err.message,
      code: 'UNSUPPORTED_FILE_TYPE'
    });
  }

  // Handle Sequelize Validation Errors (if they somehow bubble up here)
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Data validation failed for some rows. Please check file content.',
      details: err.errors.map(e => ({
          field: e.path,
          value: e.value,
          message: e.message
      }))
    });
  }

  // Catch-all for any other unhandled errors
  res.status(500).json({
    message: 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.' // Show more detail in dev
  });
};

module.exports = errorHandler;