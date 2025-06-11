// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// USER SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, companyName, role } = req.body;

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

    // Create user
    const newUser = await db.User.create({
      name: name,
      email,
      phone: phone,
      password: hashedPassword,
      role: role || 'company_admin',
      company_id: company.id,
      is_active: true,
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        company_id: newUser.company_id,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        company_id: newUser.company_id,
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

    // Find user by email
    const user = await db.User.findOne({ where: { email }, include: db.Company });
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
        role: user.role,
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
        phone:user.phone,
        role: user.role,
        company: user.Company ? user.Company : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};
