const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('../../models'); 
const { validationResult } = require('express-validator'); 
const User = db.User;
const Country = db.Country; 

// Ensure uploads/profile folder exists
const uploadPath = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Utility: Save uploaded file and return public URL
const saveProfileFile = (file) => {
    if (!file) return null;
    const filename = `${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
    const filePath = path.join(uploadPath, filename);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer); // Multer memoryStorage provides buffer
    // Return public URL for frontend
    return `${process.env.BACKEND_URL}/uploads/profile/${filename}`;
};

/**
 * GET /api/my-profile
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; 

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'profile', 'countryCodeid'],
            include: [
                {
                    model: Country,
                    as: 'Country',
                    attributes: ['phonecode'],
                }
            ],
        });

        if (!user) {
            return res.status(404).json({ status_code: 404, status: 'error', message: 'User profile not found.' });
        }

        return res.status(200).json({
            status_code: 200,
            status: 'success',
            message: 'Profile fetched successfully.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profile: user.profile,
                countryCodeid: user.countryCodeid,
                phonecode: user.Country ? user.Country.phonecode : null,
            }
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ status_code: 500, status: 'error', message: 'Server error while fetching profile.' });
    }
};

/**
 * PUT /api/admin/my-profile
 */
exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status_code: 400, status: 'error', errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, phone, email, countryCodeid } = req.body;
    const profileFile = req.file;

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ status_code: 404, status: 'error', message: 'User not found.' });

        // 1. Handle profile picture upload
        let profileUrl = user.profile;
        if (profileFile) {
            profileUrl = saveProfileFile(profileFile);
        }

        // 3. Update user
        await user.update({
            name,
            phone,
            email,
            countryCodeid,
            profile: profileUrl,
        });

        return res.status(200).json({
            status_code: 200,
            status: 'success',
            message: 'Profile updated successfully.',
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ status_code: 500, status: 'error', message: 'Server error during profile update.' });
    }
};

/**
 * PUT /api/admin/change-password
 */
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ status_code: 400, status: 'error', message: 'Old and new passwords are required.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ status_code: 404, status: 'error', message: 'User not found.' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(401).json({ status_code: 401, status: 'error', message: 'Invalid old password.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await user.update({ password: hashedPassword });

        return res.status(200).json({ status_code: 200, status: 'success', message: 'Password changed successfully.' });

    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ status_code: 500, status: 'error', message: 'Server error during password change.' });
    }
};
