const { User, Company, Country  } = require('../models'); // Assuming your models are in a 'models' directory
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');

// --- Multer Configuration for file uploads ---
const projectRoot = path.join(__dirname, '..');

const profileUploadDir = path.join(projectRoot, 'uploads', 'profile');
const companyLogoUploadDir = path.join(projectRoot, 'uploads', 'company_logo');

if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(companyLogoUploadDir)) {
    fs.mkdirSync(companyLogoUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profileImage') {
            cb(null, profileUploadDir);
        } else if (file.fieldname === 'companyLogoUrl') {
            cb(null, companyLogoUploadDir);
        } else {
            cb(new Error('Invalid file fieldname provided.'), null); // More professional error
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ storage: storage });
// --- End Multer Configuration ---

const settingsController = {

    async getGeneralSettingsDetail(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'phone', 'profile', 'company_id', 'countryCodeid'],
                include: [
                    {
                        model: Company,
                        attributes: ['id', 'name', 'logo_url'],
                    },
                    {
                        model: Country,
                        as: 'Country',
                        attributes: ['id', 'short_name', 'name', 'phonecode'],
                        required: false,
                    },
                ],
            });

            if (!user) {
                return res.status(404).json({ message: 'User profile not found.' });
            }

            const responseData = {
                profileImage: user.profile ? `${req.protocol}://${req.get('host')}/${user.profile.replace(/\\/g, '/')}` : null,
                companyName: user.Company ? user.Company.name : null,
                fullName: user.name,
                emailAddress: user.email,
                phoneNumber: user.phone,
                countryCodeid: user.countryCodeid,
                countryDetails: user.Country ? {
                    id: user.Country.id,
                    short_name: user.Country.short_name,
                    name: user.Country.name,
                    phonecode: user.Country.phonecode,
                } : null,
                companyLogoUrl: user.Company && user.Company.logo_url ? `${req.protocol}://${req.get('host')}/${user.Company.logo_url.replace(/\\/g, '/')}` : null,
            };

            res.status(200).json({ success: true, data: responseData, message: 'General settings retrieved successfully.' });
        } catch (error) {
            console.error('Error fetching general settings:', error);
            res.status(500).json({ message: 'Failed to retrieve general settings due to a server error. Please try again later.' });
        }
    },

    async updateGeneralSettingsDetail(req, res) {
        try {
            const userId = req.user.id;

            const schema = Joi.object({
                fullName: Joi.string().trim().required().messages({
                    'any.required': 'Full name is required.',
                    'string.empty': 'Full name cannot be empty.'
                }),
                emailAddress: Joi.string().email().required().messages({
                    'any.required': 'Email address is required.',
                    'string.email': 'Please enter a valid email address.',
                    'string.empty': 'Email address cannot be empty.'
                }),
                // Revised Joi validation for phoneNumber and countryCodeid
                phoneNumber: Joi.string().trim()
                    .pattern(/^[0-9\s-]{6,15}$/) // Basic pattern for 6-15 digits, spaces, dashes
                    .messages({
                        'string.pattern.base': 'Please enter a valid phone number (6-15 digits, dashes, or spaces allowed).',
                        'string.empty': 'Phone number cannot be empty if provided.',
                        'any.required': 'Phone number is required when a country code is provided.'
                    }),
                countryCodeid: Joi.string().trim()
                    .guid({ version: ['uuidv4'] }) // Validate as UUID v4
                    .messages({
                        'string.guid': 'Country code ID must be a valid UUID.',
                        'string.empty': 'Country code ID cannot be empty if provided.',
                        'any.required': 'Country code ID is required when a phone number is provided.'
                    }),
                companyName: Joi.string().trim().when('companyLogoUrl', {
                    is: Joi.exist(),
                    then: Joi.required().messages({
                        'any.required': 'Company name is required when a company logo is uploaded.',
                        'string.empty': 'Company name cannot be empty.'
                    }),
                    otherwise: Joi.string().trim().optional().allow('')
                }),
            }).unknown(true)
            .and('phoneNumber', 'countryCodeid') // Ensures both are present if either is
            .with('phoneNumber', 'countryCodeid') // Ensures if phoneNumber is present, countryCodeid must be
            .with('countryCodeid', 'phoneNumber'); // Ensures if countryCodeid is present, phoneNumber must be

            const { error } = schema.validate(req.body);
            if (error) {
                console.error('Joi validation error:', error.details[0].message); // Log validation error
                return res.status(400).json({ message: error.details[0].message });
            }

            const { fullName, emailAddress, phoneNumber, companyName, countryCodeid } = req.body;

            const profileImageFile = req.files && req.files['profileImage'] ? req.files['profileImage'][0] : null;
            const companyLogoFile = req.files && req.files['companyLogoUrl'] ? req.files['companyLogoUrl'][0] : null;

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'User profile not found.' });
            }

            // Check for unique email address if it's being changed
            if (emailAddress && emailAddress.toLowerCase() !== user.email.toLowerCase()) {
                const existingUserWithEmail = await User.findOne({ where: { email: emailAddress } });
                if (existingUserWithEmail) {
                    if (profileImageFile && fs.existsSync(profileImageFile.path)) {
                        fs.unlinkSync(profileImageFile.path);
                    }
                    if (companyLogoFile && fs.existsSync(companyLogoFile.path)) {
                        fs.unlinkSync(companyLogoFile.path);
                    }
                    return res.status(409).json({ message: 'The email address provided is already registered to another account. Please use a different email or log in.' });
                }
            }

            // --- IMPORTANT: Validate countryCodeid against your Country table ---
            // This should be done only if a countryCodeid is provided (not null or empty string)
            if (countryCodeid && countryCodeid !== '') {
                const countryExists = await Country.findByPk(countryCodeid);
                if (!countryExists) {
                    // Clean up uploaded files if validation fails
                    if (profileImageFile && fs.existsSync(profileImageFile.path)) {
                        fs.unlinkSync(profileImageFile.path);
                    }
                    if (companyLogoFile && fs.existsSync(companyLogoFile.path)) {
                        fs.unlinkSync(companyLogoFile.path);
                    }
                    return res.status(400).json({ message: 'Invalid countryCodeid provided. The country does not exist.' });
                }
            } else if (!countryCodeid && phoneNumber) {
                // If phoneNumber is provided but countryCodeid is not, it's an error based on your rule
                if (profileImageFile && fs.existsSync(profileImageFile.path)) {
                    fs.unlinkSync(profileImageFile.path);
                }
                if (companyLogoFile && fs.existsSync(companyLogoFile.path)) {
                    fs.unlinkSync(companyLogoFile.path);
                }
                return res.status(400).json({ message: 'Country code ID is required when a phone number is provided.' });
            } else if (countryCodeid && !phoneNumber) {
                 // If countryCodeid is provided but phoneNumber is not, it's an error based on your rule
                 if (profileImageFile && fs.existsSync(profileImageFile.path)) {
                    fs.unlinkSync(profileImageFile.path);
                }
                if (companyLogoFile && fs.existsSync(companyLogoFile.path)) {
                    fs.unlinkSync(companyLogoFile.path);
                }
                return res.status(400).json({ message: 'Phone number is required when a country code is provided.' });
            }


            // Update User details
            user.name = fullName;
            user.email = emailAddress;
            user.phone = phoneNumber === '' ? null : phoneNumber; // Store null if empty string
            user.countryCodeid = countryCodeid === '' ? null : countryCodeid; // Store null if empty string


            if (profileImageFile) {
                if (user.profile && fs.existsSync(path.join(projectRoot, user.profile))) {
                    try {
                        fs.unlinkSync(path.join(projectRoot, user.profile));
                    } catch (err) {
                        console.error(`Warning: Could not delete old profile image at ${user.profile}:`, err);
                    }
                }
                user.profile = path.relative(projectRoot, profileImageFile.path).replace(/\\/g, '/');
            }
            await user.save();

            // Update Company details if the user belongs to a company
            if (user.company_id) {
                const company = await Company.findByPk(user.company_id);
                if (company) {
                    if (companyName !== undefined && companyName !== company.name) {
                        company.name = companyName;
                    }

                    if (companyLogoFile) {
                        if (company.logo_url && fs.existsSync(path.join(projectRoot, company.logo_url))) {
                            try {
                                fs.unlinkSync(path.join(projectRoot, company.logo_url));
                            } catch (err) {
                                console.error(`Warning: Could not delete old company logo at ${company.logo_url}:`, err);
                            }
                        }
                        company.logo_url = path.relative(projectRoot, companyLogoFile.path).replace(/\\/g, '/');
                    }
                    await company.save();
                } else {
                    console.warn(`Company with ID ${user.company_id} not found for user ${userId}.`);
                }
            }

            // Re-fetch user with updated data to send back in response
            const updatedUser = await User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'phone', 'profile', 'company_id', 'countryCodeid'],
                include: [
                    {
                        model: Company,
                        attributes: ['id', 'name', 'logo_url'],
                    },
                    {
                        model: Country,
                        as: 'Country',
                        attributes: ['id', 'short_name', 'name', 'phonecode'],
                        required: false,
                    },
                ],
            });

            const responseData = {
                profileImage: updatedUser.profile ? `${req.protocol}://${req.get('host')}/${updatedUser.profile.replace(/\\/g, '/')}` : null,
                companyName: updatedUser.Company ? updatedUser.Company.name : null,
                fullName: updatedUser.name,
                emailAddress: updatedUser.email,
                phoneNumber: updatedUser.phone,
                countryCodeid: updatedUser.countryCodeid,
                countryDetails: updatedUser.Country ? {
                    id: updatedUser.Country.id,
                    short_name: updatedUser.Country.short_name,
                    name: updatedUser.Country.name,
                    phonecode: updatedUser.Country.phonecode,
                } : null,
                companyLogoUrl: updatedUser.Company && updatedUser.Company.logo_url ? `${req.protocol}://${req.get('host')}/${updatedUser.Company.logo_url.replace(/\\/g, '/')}` : null,
            };

            res.status(200).json({ success: true, message: 'General settings updated successfully!', data: responseData });
        } catch (error) {
            console.error('Error updating general settings:', error);
            res.status(500).json({ message: 'Failed to update general settings due to a server error. Please try again later.' });
        }
    },

    async updatePassword(req, res) {
        try {
            const userId = req.user.id;

            // Joi validation schema for password update
            const schema = Joi.object({
                currentPassword: Joi.string().required().messages({
                    'any.required': 'Your current password is required.',
                    'string.empty': 'Current password cannot be empty.'
                }),
                newPassword: Joi.string()
                    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'))
                    .required()
                    .messages({
                        'any.required': 'A new password is required.',
                        'string.empty': 'New password cannot be empty.',
                        'string.pattern.base': 'New password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).',
                    }),
                confirmPassword: Joi.string()
                    .valid(Joi.ref('newPassword')) // Ensures confirmPassword matches newPassword
                    .required()
                    .messages({
                        'any.required': 'Please confirm your new password.',
                        'string.empty': 'Confirm password cannot be empty.',
                        'any.only': 'The new password and confirmation do not match. Please re-enter them.'
                    }),
            });

            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }

            const { currentPassword, newPassword } = req.body;

            const user = await User.findByPk(userId);

            if (!user) {
                // Again, robust check, though should be covered by auth middleware
                return res.status(404).json({ message: 'User account not found.' });
            }

            // 1. Verify current password using bcrypt.compare
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'The current password you entered is incorrect.' });
            }

            // Prevent updating with the same password as current
            const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
            if (isSameAsCurrent) {
                return res.status(400).json({ message: 'Your new password cannot be the same as your current password.' });
            }

            // 2. Hash the new password using bcrypt.hash
            const salt = await bcrypt.genSalt(10); // Generate a salt
            const hashedPassword = await bcrypt.hash(newPassword, salt); // Hash the new password

            user.password = hashedPassword; // Store the hashed new password
            await user.save();

            res.status(200).json({ success: true, message: 'Your password has been updated successfully.' });
        } catch (error) {
            console.error('Error updating password:', error); // Log detailed error
            res.status(500).json({ message: 'Failed to update password due to a server error. Please try again later.' });
        }
    },
};

module.exports = { settingsController, upload };