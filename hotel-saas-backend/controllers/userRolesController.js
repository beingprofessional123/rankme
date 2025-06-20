// controllers/userRolesController.js
const db = require('../models'); // Make sure this path is correct
const bcrypt = require('bcrypt');
const { Op } = require('sequelize'); // Import Op for Sequelize operators

// Helper function to generate a random password
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8); // Generates an 8-character alphanumeric string
};

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
    res.status(500).json({ message: 'Failed to fetch roles', error: error.message });
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
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// API 3: Create a new user
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, phone, role_id, company_id, is_active } = req.body; // Expecting role_id directly now

    // Basic validation
    if (!fullName || !email || !role_id) {
      return res.status(400).json({ message: 'Full name, email, and role are required.' });
    }

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

    // Generate a temporary password and hash it
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await db.User.create({
      name: fullName,
      email,
      phone: phone || null, // Phone can be optional
      password: hashedPassword,
      role_id,
      company_id: company_id || null, // Company can be optional or handled by context
      is_active: typeof is_active === 'boolean' ? is_active : true, // Default to true
    });

    // In a real application, you would email this temporary password to the user
    console.log(`User created: ${newUser.email}, Temporary Password: ${tempPassword}`);

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id,
        company_id: newUser.company_id,
      },
      // IMPORTANT: Do NOT return the temporary password in a real API response.
      // The user should receive it via email.
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
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
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
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
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// API 5: Update an existing user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role_id, company_id, is_active } = req.body;

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check for email change and existing email (if email is being updated)
    if (email && email !== user.email) {
      const existingUserWithNewEmail = await db.User.findOne({ where: { email } });
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== user.id) {
        return res.status(400).json({ message: 'Email already in use by another user.' });
      }
    }

    // Check if the provided role_id is valid (if role_id is being updated)
    if (role_id) {
      const roleExists = await db.Role.findByPk(role_id);
      if (!roleExists) {
        return res.status(400).json({ message: 'Invalid role ID provided.' });
      }
    }

    // Update fields only if they are provided in the request body
    user.name = fullName || user.name;
    user.email = email || user.email;
    user.phone = phone !== undefined ? phone : user.phone; // Allow null to be set explicitly
    user.role_id = role_id || user.role_id;
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
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// API 6: Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Prevent deletion of 'super_admin' or 'company_admin' roles through this API
    const userToDelete = await db.User.findByPk(id, { include: { model: db.Role, attributes: ['name'] } });
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (userToDelete.Role && (userToDelete.Role.name === 'super_admin' || userToDelete.Role.name === 'company_admin')) {
      return res.status(403).json({ message: 'Forbidden: Cannot delete super_admin or company_admin through this API.' });
    }


    const result = await db.User.destroy({
      where: { id },
    });

    if (result === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};