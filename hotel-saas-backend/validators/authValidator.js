const { body, validationResult } = require('express-validator');

const VALID_ROLES = [
  'super_admin',
  'company_admin',
  'revenue_manager',
  'general_manager',
  'analyst',
];

exports.signupValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(VALID_ROLES).withMessage('Invalid role'),

  // Conditional check: companyName is required if role is NOT super_admin
  body('companyName').custom((value, { req }) => {
    if (req.body.role !== 'super_admin' && (!value || value.trim() === '')) {
      throw new Error('Company name is required');
    }
    return true;
  }),
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
