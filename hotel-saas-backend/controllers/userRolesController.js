// controllers/userRolesController.js
const db = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const crypto = require('crypto'); // Already used in authController, good practice to declare if used here
const nodemailer = require('nodemailer'); // New import

// Import the new email template
const getNewUserPasswordEmail = require('../emailTemplate/NewUserPassword');

// Helper function to generate a random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString('hex'); // Generates a 16-character hex string (more secure)
  // Or for a truly memorable one, consider a library like 'generate-password'
  // return Math.random().toString(36).slice(-8); // Generates an 8-character alphanumeric string
};

// Configure Nodemailer transporter (ensure environment variables are set)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT, 10), // Ensure port is an integer
  secure: (process.env.MAIL_ENCRYPTION || '').toLowerCase() === 'ssl' || parseInt(process.env.MAIL_PORT, 10) === 465, // Check for 'ssl' or port 465
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    // This is optional, but often needed for self-signed certificates or specific server configurations
    // rejectUnauthorized: false // Use this only if you know your SMTP server uses self-signed certs for testing. Not recommended for production.
  }
});


// API 1: Get all role names exclude 'super_admin' and 'company_admin'
exports.getUserRoles = async (req, res) => {
  try {
    const excludedRoleNames = ['super_admin', 'company_admin'];

    const roles = await db.Role.findAll({
      where: {
        name: {
          [Op.notIn]: excludedRoleNames,
        },
      },
      attributes: ['id', 'name', 'description'], // Specify attributes to return
      order: [['name', 'ASC']], // Order them alphabetically by name
    });

    res.status(200).json({
      message: 'Roles fetched successfully',
      roles,
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    // Generic error message for client, detailed error for logs
    res.status(500).json({ message: 'Failed to fetch roles. Please try again later.' });
  }
};

// API 2: Get list of users where role is not 'super_admin' and 'company_admin'
exports.getUsersByRoleExclusion = async (req, res) => {
  try {
    const excludedRoleNames = ['super_admin', 'company_admin'];

    // First, find the IDs of the roles to exclude
    const excludedRoles = await db.Role.findAll({
      where: {
        name: {
          [Op.in]: excludedRoleNames,
        },
      },
      attributes: ['id'], // We only need their IDs
    });

    const excludedRoleIds = excludedRoles.map((role) => role.id);

    // Fetch users, excluding those with the found role IDs
    const users = await db.User.findAll({
      where: {
        role_id: {
          [Op.notIn]: excludedRoleIds,
        },
        // If you want to filter by company_id based on the logged-in user's company_id
        // company_id: req.user.company_id, // Uncomment if relevant for company_admin
      },
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }, // Exclude sensitive info
      include: [
        {
          model: db.Role, // Include the Role to show role name
          attributes: ['name'],
        },
        {
          model: db.Company, // Include Company if company name is needed
          attributes: ['name'],
        }
      ],
      order: [['createdAt', 'DESC']], // Order by creation date, newest first
    });

    // Format the response to flatten role and company names
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      profile: user.profile,
      company_id: user.company_id,
      role_id: user.role_id,
      role_name: user.Role ? user.Role.name : null, // Flatten role name
      company_name: user.Company ? user.Company.name : null, // Flatten company name
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));


    res.status(200).json({
      message: 'Users fetched successfully',
      users: formattedUsers,
    });
  } catch (error) {
    console.error('Error fetching users by role exclusion:', error);
    res.status(500).json({ message: 'Failed to fetch users. Please try again later.' });
  }
};

// API 3: Create a new user
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, phone, role_id, company_id, is_active } = req.body;

    // --- Input Validation ---
    const errors = {};
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      errors.fullName = 'Full name is required and must be at least 2 characters.';
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Valid email is required.';
    }
    if (!role_id) {
      errors.role_id = 'Role is required.';
    }
    // phone is optional, but if provided, could add format validation

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    // --- End Input Validation ---

    // Check if user with this email already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Check if the provided role_id is valid
    const roleExists = await db.Role.findByPk(role_id);
    if (!roleExists) {
      return res.status(400).json({ message: 'Invalid role ID provided.' });
    }

    // Determine company_id:
    // If the logged-in user is a company_admin, the new user should belong to the same company.
    // If it's a super_admin, they might provide a company_id, or it could be null.
    let finalCompanyId = null;
    if (req.user.company_id) { // If the admin creating the user belongs to a company
        finalCompanyId = req.user.company_id;
    } else if (company_id) { // If super_admin provides a company_id
        const companyExists = await db.Company.findByPk(company_id);
        if (!companyExists) {
            return res.status(400).json({ message: 'Provided company ID is invalid.' });
        }
        finalCompanyId = company_id;
    }


    // Generate a temporary password and hash it
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await db.User.create({
      name: fullName.trim(), // Trim whitespace
      email: email.toLowerCase(), // Store email in lowercase
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      role_id,
      company_id: finalCompanyId,
      is_active: typeof is_active === 'boolean' ? is_active : true, // Default to true
    });

    // --- Send Email with Temporary Password ---
    try {
      const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'YOUR_FRONTEND_LOGIN_URL'; // Replace with actual frontend URL
      const { subject, html } = getNewUserPasswordEmail(newUser.name, newUser.email, tempPassword, loginUrl);

      await transporter.sendMail({
        from: process.env.MAIL_USERNAME,
        to: newUser.email,
        subject,
        html,
      });
      console.log(`Temporary password email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error(`Failed to send temporary password email to ${newUser.email}:`, emailError);
      // Decide if this should be a hard error or just logged.
      // For user creation, often you'd still create the user but alert about email failure.
      // For now, it will proceed but log the email error.
    }
    // --- End Send Email ---

    res.status(201).json({
      message: 'User created successfully. A temporary password has been sent to their email.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id,
        company_id: newUser.company_id,
        is_active: newUser.is_active,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    // Handle Sequelize validation errors or unique constraint errors specifically if desired
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'User with this email already exists.', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Failed to create user. Please try again later.', error: error.message });
  }
};

// API 4: Get a single user by ID (for prefill/edit)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }, // Exclude sensitive info
      include: [
        {
          model: db.Role,
          attributes: ['id', 'name'], // Get role ID and name
        },
        {
          model: db.Company,
          attributes: ['id', 'name'], // Get company ID and name
        }
      ],
      // Add company_id filter if the logged-in user is a company_admin
      where: req.user.company_id ? { company_id: req.user.company_id } : {},
    });

    // Important: Also check if the user found belongs to the same company if applicable
    if (!user || (req.user.company_id && user.company_id !== req.user.company_id)) {
      return res.status(404).json({ message: 'User not found or you do not have permission to view this user.' });
    }

    // Flatten response for easier client-side consumption
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
      profile: user.profile,
      company_id: user.company_id,
      role_id: user.role_id,
      role_name: user.Role ? user.Role.name : null,
      company_name: user.Company ? user.Company.name : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: 'User fetched successfully',
      user: formattedUser,
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Failed to fetch user. Please try again later.' });
  }
};

// API 5: Update an existing user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role_id, company_id, is_active } = req.body;

    const user = await db.User.findByPk(id, {
        // Add company_id filter for company_admin
        where: req.user.company_id ? { company_id: req.user.company_id } : {},
        include: [{ model: db.Role, attributes: ['name'] }] // Include role to check for admin roles
    });

    // Important: Also check if the user found belongs to the same company if applicable
    if (!user || (req.user.company_id && user.company_id !== req.user.company_id)) {
        return res.status(404).json({ message: 'User not found or you do not have permission to update this user.' });
    }

    // Prevent updating super_admin or company_admin roles of *other* users unless you are a super_admin.
    // A company_admin cannot change another company_admin or super_admin.
    if (user.Role && (user.Role.name === 'super_admin' || user.Role.name === 'company_admin')) {
        if (req.user.Role.name !== 'super_admin' && req.user.id !== user.id) { // Allow self-update or super_admin to update
            return res.status(403).json({ message: 'Forbidden: Cannot update other super_admin or company_admin users.' });
        }
    }
    // Prevent changing a user's role to super_admin or company_admin unless you are a super_admin.
    if (role_id) {
        const newRole = await db.Role.findByPk(role_id);
        if (newRole && (newRole.name === 'super_admin' || newRole.name === 'company_admin')) {
            if (req.user.Role.name !== 'super_admin') {
                return res.status(403).json({ message: 'Forbidden: You cannot assign this role.' });
            }
        }
    }


    // --- Input Validation for update ---
    const errors = {};
    if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
      errors.fullName = 'Full name must be at least 2 characters if provided.';
    }
    if (email !== undefined && (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email))) {
      errors.email = 'Valid email format required if provided.';
    }
    if (role_id !== undefined) {
      const roleExists = await db.Role.findByPk(role_id);
      if (!roleExists) {
        errors.role_id = 'Invalid role ID provided.';
      }
    }
    if (company_id !== undefined && company_id !== null) { // If company_id is provided and not null
        const companyExists = await db.Company.findByPk(company_id);
        if (!companyExists) {
            errors.company_id = 'Invalid company ID provided.';
        }
    }
    // Add more validation for other fields if necessary

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    // --- End Input Validation ---


    // Check for email change and existing email (if email is being updated)
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUserWithNewEmail = await db.User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== user.id) {
        return res.status(400).json({ message: 'Email already in use by another user.' });
      }
    }

    // Update fields only if they are provided in the request body
    user.name = fullName !== undefined ? fullName.trim() : user.name;
    user.email = email !== undefined ? email.toLowerCase() : user.email;
    user.phone = phone !== undefined ? phone : user.phone; // Allow null to be set explicitly
    user.role_id = role_id !== undefined ? role_id : user.role_id;
    user.company_id = company_id !== undefined ? company_id : user.company_id; // Allow null to be set explicitly
    user.is_active = typeof is_active === 'boolean' ? is_active : user.is_active;

    await user.save();

    res.status(200).json({
      message: 'User updated successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        company_id: user.company_id,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already in use.', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Failed to update user. Please try again later.', error: error.message });
  }
};

// API 6: Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user with role to apply specific deletion rules
    const userToDelete = await db.User.findByPk(id, {
        attributes: ['id', 'company_id'], // Need ID and company_id
        include: { model: db.Role, attributes: ['name'] } // Need role name
    });

    // Check if user exists
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Authorization checks:
    // 1. A company_admin can only delete users within their own company.
    // 2. Prevent deletion of 'super_admin' or 'company_admin' roles by any non-super_admin.
    // 3. Prevent self-deletion if that's a rule you want to enforce.

    // Rule 1: Company Admin trying to delete user outside their company
    if (req.user.company_id && userToDelete.company_id !== req.user.company_id) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this user.' });
    }

    // Rule 2: Prevent deletion of super_admin or company_admin by non-super_admin
    if (userToDelete.Role && (userToDelete.Role.name === 'super_admin' || userToDelete.Role.name === 'company_admin')) {
      if (req.user.Role.name !== 'super_admin') { // Only a super_admin can delete other super/company admins
        return res.status(403).json({ message: 'Forbidden: Cannot delete super_admin or company_admin users.' });
      }
    }

    // Rule 3 (Optional): Prevent self-deletion
    if (req.user.id === userToDelete.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot delete your own account through this API.' });
    }


    const result = await db.User.destroy({
      where: { id: userToDelete.id }, // Use userToDelete.id to ensure the same user found is deleted
    });

    if (result === 0) { // This should ideally not happen if userToDelete was found
      return res.status(404).json({ message: 'User not found or already deleted.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user. Please try again later.' });
  }
};