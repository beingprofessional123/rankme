const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const db = require('../../models');

const userController = {

  getUserRoles: async (req, res) => {
    try {
      // ❌ Exclude only 'admin'
      const excludedRoleNames = ['super_admin'];

      const roles = await db.Role.findAll({
        where: {
          name: {
            [Op.notIn]: excludedRoleNames,
          },
        },
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']],
      });

      res.status(200).json({
        status: 'success',
        status_code: 200,
        status_message: 'OK',
        message: 'Roles fetched successfully',
        results: roles,
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({
        status: 'error',
        status_code: 500,
        status_message: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch roles. Please try again later.',
        results: null,
      });
    }
  },

  // GET /api/admin/user-management-list
  getUsers: async (req, res) => {
  try {
    const users = await db.User.findAll({
      where: {
        '$Role.name$': { [Op.ne]: 'super_admin' },
      },
      include: [
        {
          model: db.Company,
          as: 'Company',
          attributes: ['name'],
        },
        {
          model: db.Role,
          attributes: ['name'],
        },
        {
          model: db.Country,
          as: 'Country',
          attributes: ['phonecode'],
        },
        {
          model: db.UserSubscription,
          as: 'UserSubscriptions', // ⬅️ Include user subscriptions
          include: [
            {
              model: db.SubscriptionPlan,
              as: 'subscriptionPlan',
              attributes: ['id', 'name', 'price', 'billing_period'], // Include needed fields
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
    });

    const formattedUsers = users.map((user) => {
      const phonecode = user.Country?.phonecode || '';
      const phone = user.phone || '';
      const subscription = user.UserSubscriptions?.[0]?.subscriptionPlan; // Assuming latest or first is enough

      return {
        id: user.id,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ')[1] || '',
        email: user.email,
        phone: phonecode ? `${phonecode} ${phone}`.trim() : phone,
        role: user.Role?.name || 'N/A',
        profile: user.profile,
        status: user.is_active ? '1' : '0',
        created_at: user.createdAt,
        company_id: user.company_id,
        company_name: user.Company?.name || 'No Company',
        subscription_plan: subscription
          ? {
              id: subscription.id,
              name: subscription.name,
              price: subscription.price,
              billing_period: subscription.billing_period,
            }
          : null,
      };
    });

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
            attributes: ['name', 'id'],
          },
          {
            model: db.Role,
            attributes: ['name', 'id'],
          },
          {
            model: db.Country,
            as: 'Country',
            attributes: ['phonecode'], // Add 'name' if you want full country name
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
      const {
        name,
        email,
        phone,
        password,
        role_id,
        status,
        company_name,
        countryCodeid,
      } = req.body;

      // Required fields check
      if (!name || !email || !password || !role_id || !company_name) {
        return res.status(400).json({
          status: 'error',
          status_code: 400,
          status_message: 'BAD_REQUEST',
          message: 'Missing required fields',
          results: null,
        });
      }

      // Duplicate user check
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

      // Create company
      const company = await db.Company.create({
        name: company_name,
        contact_email: email,
        contact_phone: phone,
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Upload profile image if exists
      const profileUrl = req.file
        ? `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`
        : null;

      // Create user
      const newUser = await db.User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role_id,
        is_active: status === '1',
        company_id: company.id,
        profile: profileUrl,
        countryCodeid,
      });

      // Return response
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
          role_id: newUser.role_id,
          company_id: newUser.company_id,
          profile: newUser.profile,
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

      const {
        name,
        email,
        phone,
        countryCodeid,
        role_id,
        status,
        company_name,
        company_id,
        password,
      } = req.body;

      // 🏢 Update company name if company_id and company_name are provided
      if (company_id && company_name) {
        const company = await db.Company.findByPk(company_id);
        if (company) {
          await company.update({ name: company_name });
        }
      }

      // 🖼️ Handle profile image update
      if (req.file) {
        const oldImagePath = path.join(__dirname, '../../uploads/profile', path.basename(user.profile || ''));
        if (user.profile && fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Delete old profile image
        }

        req.body.profile = `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`;
      }

      // 🔐 If password is provided, hash it
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        req.body.password = hashedPassword;
      } else {
        delete req.body.password;
      }

      // 🔄 Handle status
      if (status !== undefined) {
        req.body.is_active = status === '1' || status === true || status === 'true';
      }

      // Update user fields
      await user.update({
        name,
        email,
        phone,
        countryCodeid,
        role_id,
        company_id,
        profile: req.body.profile || user.profile,
        password: req.body.password || user.password,
        is_active: req.body.is_active,
      });

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
