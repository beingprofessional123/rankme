const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const db = require('../../models');

const userController = {
  // GET /api/admin/user-management-list
  getUsers: async (req, res) => {
    try {
      const users = await db.User.findAll({
        where: {
          role: { [Op.ne]: 'super_admin' },
        },
        include: [
          {
            model: db.Company,
            as: 'Company',
            attributes: ['name'],
          },
        ],
        order: [['id', 'DESC']],
      });

      const formattedUsers = users.map((user) => ({
        id: user.id,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ')[1] || '',
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
        status: user.is_active ? '1' : '0',
        created_at: user.createdAt,
        company_id: user.company_id,
        company_name: user.Company?.name || 'No Company',
      }));

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Users fetched successfully',
        results: formattedUsers,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching users',
        results: null,
      });
    }
  },

  // GET /api/admin/user-management/:id
  getUserById: async (req, res) => {
    try {
      const user = await db.User.findByPk(req.params.id, {
        include: [
          {
            model: db.Company,
            as: 'Company',
            attributes: ['name'],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          status_code: 404,
          status_message: 'NOT_FOUND',
          message: 'User not found',
          results: null,
        });
      }

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'User fetched successfully',
        results: user,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching user',
        results: null,
      });
    }
  },

  // POST /api/admin/user-management
  createUser: async (req, res) => {
    try {
      const { name, email, phone, password, role, status, company_id } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          status: 'error',
          status_code: 400,
          status_message: 'BAD_REQUEST',
          message: 'Missing required fields',
          results: null,
        });
      }

      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          status_code: 400,
          status_message: 'BAD_REQUEST',
          message: 'User already registered. Please use another email.',
          results: null,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const profileUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}` : null;

      const newUser = await db.User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || 'company_admin',
        is_active: status === '1',
        company_id: company_id || null,
        profile: profileUrl,
      });

      res.status(201).json({
        status: 'success',
        status_code: 201,
        status_message: 'CREATED',
        message: 'User created successfully',
        results: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          company_id: newUser.company_id,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error creating user',
        results: null,
      });
    }
  },

  // PUT /api/admin/user-management/:id

  updateUser: async (req, res) => {
    try {
      const user = await db.User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          status_code: 404,
          status_message: 'NOT_FOUND',
          message: 'User not found',
          results: null,
        });
      }

      // Handle profile image update
      if (req.file) {
        const oldImagePath = path.join(__dirname, '../../uploads/profile', path.basename(user.profile || ''));

        if (user.profile && fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Delete old profile image
        }

        // ✅ Save full URL to profile
        req.body.profile = `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`;
      }

      // Handle status
      if (req.body.status !== undefined) {
        req.body.is_active = req.body.status === '1' || req.body.status === true || req.body.status === 'true';
      }

      await user.update(req.body);

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'User updated successfully',
        results: user,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error updating user',
        results: null,
      });
    }
  },

  // DELETE /api/admin/user-management/:id
  deleteUser: async (req, res) => {
    try {
      const user = await db.User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          status_code: 404,
          status_message: 'NOT_FOUND',
          message: 'User not found',
          results: null,
        });
      }

      // Delete related records manually (adjust these based on your DB)
      await db.UserSubscription?.destroy({ where: { user_id: user.id } });
      await db.Payment?.destroy({ where: { user_id: user.id } });
      // Add more models here as needed...

      // Delete profile image if exists
      if (user.profile && path.basename(user.profile) !== '') {
        const filePath = path.join(__dirname, '../../uploads/profile', path.basename(user.profile));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (imgErr) {
          console.warn('Failed to delete profile image:', imgErr.message);
        }
      }

      // Finally, delete the user
      await user.destroy();

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'User and all related data deleted successfully',
        results: null,
      });
    } catch (error) {
      console.error('Error deleting user and related data:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Error deleting user and related data',
        results: null,
      });
    }
  },


};

module.exports = userController;
