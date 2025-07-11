// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Ensure your db object has User, Company, and Role models
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const getForgotPasswordEmail = require('../emailTemplate/ForgetPassword');

// Helper to get role ID by name
const getRoleId = async (roleName) => {
    const role = await db.Role.findOne({ where: { name: roleName } });
    if (!role) {
        throw new Error(`Role "${roleName}" not found. Please ensure it exists in the Roles table.`);
    }
    return role.id;
};


// USER SIGNUP
exports.signup = async (req, res) => {
    try {
        const { name, email, phone, password, companyName, role, countryCodeid } = req.body; // 'role' here is the roleName string

        // Check if user already exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already registered. Please log in or use another email.' });
        }

        // Create company
        const company = await db.Company.create({
            name: companyName,
            contact_email: email,
            contact_phone: phone,
        });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get the role_id based on the provided role name
        const roleIdToAssign = await getRoleId(role || 'company_admin'); // Default to 'company_admin'

        // Create user
        const newUser = await db.User.create({
            name: name,
            email,
            phone: phone,
            password: hashedPassword,
            role_id: roleIdToAssign, // Assign the role_id
            company_id: company.id,
            is_active: true,
            countryCodeid: countryCodeid,
        });

        // Re-fetch the newly created user with Company and Role details for the response
        const userWithDetails = await db.User.findByPk(newUser.id, {
            include: [
                { model: db.Company },
                { model: db.Role, attributes: ['name'] } // Include Role to get the name
            ]
        });

        // Generate JWT
        const token = jwt.sign(
            {
                id: userWithDetails.id,
                email: userWithDetails.email,
                role_id: userWithDetails.role_id, // IMPORTANT: Store role_id in the token, not the role name
                company_id: userWithDetails.company_id,
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                id: userWithDetails.id,
                name: userWithDetails.name,
                email: userWithDetails.email,
                phone: userWithDetails.phone,
                role: userWithDetails.Role ? userWithDetails.Role.name : null, // Access the role name
                company: userWithDetails.Company ? userWithDetails.Company : null, // Include company details
                profile_image: userWithDetails.profile,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Signup failed', error: error.message });
    }
};

// USER LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email, and include their Role and Company
        const user = await db.User.findOne({
            where: { email },
            include: [
                { model: db.Company },
                { model: db.Role, attributes: ['name'] } // Include Role to get the name
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Incorrect email or password. Please try again.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role_id: user.role_id, // IMPORTANT: Store role_id in the token
                company_id: user.company_id,
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.Role ? user.Role.name : null, // Access the role name from the included Role object
                company: user.Company ? user.Company : null,
                profile_image: user.profile,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

// FORGOT PASSWORD (No changes needed here as it doesn't rely on role name)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 60 * 60 * 1000;

        user.reset_password_token = resetToken;
        user.reset_password_expires = new Date(resetTokenExpiry);
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT),
            secure: (process.env.MAIL_ENCRYPTION || '').toLowerCase() === 'ssl',
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
        });

        const { subject, html } = getForgotPasswordEmail(user.name, resetLink);

        await transporter.sendMail({
            from: process.env.MAIL_USERNAME,
            to: user.email,
            subject,
            html,
        });
        return res.json({ message: 'A password reset link has been sent to your email.' });

    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ message: 'Error sending reset link', error: err.message });
    }
};

// Reset PASSWORD (No changes needed here)
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
        // 1. Find user with matching token and check expiry
        const user = await db.User.findOne({
            where: {
                reset_password_token: token,
                reset_password_expires: { [db.Sequelize.Op.gt]: new Date() }, // not expired
            },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update user password and clear token
        user.password = hashedPassword;
        user.reset_password_token = null;
        user.reset_password_expires = null;

        await user.save();

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Failed to reset password.', error: err.message });
    }
};

// Get All country
exports.getAllCountries = async (req, res) => {
    try {
        const countries = await db.Country.findAll({
            attributes: ['id', 'short_name', 'name', 'phonecode'],
            order: [['name', 'ASC']],
        });

        res.status(200).json({
            status: 'success',
            status_code: 200,
            status_message: 'OK',
            message: 'Country list fetched successfully',
            results: countries,
        });
    } catch (err) {
        console.error('Error fetching countries:', err);
        res.status(500).json({
            status: 'error',
            status_code: 500,
            status_message: 'Internal Server Error',
            message: 'Failed to fetch countries',
            error: err.message,
        });
    }
};


// Get user permissions with role name
exports.getUserPermissions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user with Role
        const user = await db.User.findOne({
            where: { id: userId },
            attributes: ['id', 'name', 'email', 'phone', 'profile','company_id'], // Add more if needed
            include: [
                {
                    model: db.Role,
                    attributes: ['id', 'name'],
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                status_code: 404,
                status_message: 'NOT_FOUND',
                message: 'User not found',
                results: null
            });
        }

        // Fetch permissions
        const userPermissions = await db.UserPermission.findAll({
            where: { user_id: userId },
            attributes: ['module_key', 'permission_key', 'is_allowed'],
        });

        // Transform to structured object
        const formatted = {};
        userPermissions.forEach(({ module_key, permission_key, is_allowed }) => {
            if (!formatted[module_key]) formatted[module_key] = {};
            formatted[module_key][permission_key] = is_allowed;
        });

        res.status(200).json({
            status: 'success',
            status_code: 200,
            status_message: 'OK',
            message: 'Permissions fetched successfully',
            results: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    profile: user.profile,
                    company_id: user.company_id,
                },
                role: {
                    id: user.Role?.id || null,
                    name: user.Role?.name || null
                },
                permissions: formatted,
            }
        });

    } catch (err) {
        console.error('Error fetching permissions:', err);
        res.status(500).json({
            status: 'error',
            status_code: 500,
            status_message: 'INTERNAL_SERVER_ERROR',
            message: 'Error fetching permissions',
            results: null
        });
    }
};