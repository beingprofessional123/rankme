// controllers/supportTicketController.js
const db = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {  } = require('../utils/mailer'); // Assuming you have this utility
const getUserSupportTicketEmail = require('../emailTemplate/UserSupportTicket');
const getAdminSupportTicketEmail = require('../emailTemplate/AdminSupportTicket');

// --- Multer Configuration (remains largely the same) ---
const uploadDir = path.join(__dirname, '../uploads/support_tickets');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    },
}).single('file');

const uploadThreadFile = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    },
}).single('threadFile');

// Helper function for consistent error responses
const sendErrorResponse = (res, statusCode, message, error = null) => {
    console.error(`Error ${statusCode}: ${message}`, error);
    res.status(statusCode).json({ success: false, message, error: error ? error.message || error : null });
};

// --- NEW HELPER FUNCTION FOR TICKET NUMBER LOGIC ---
const getNextTicketNumber = async () => {
    // Find the latest ticket by ticketNumber in descending order
    const latestTicket = await db.SupportTicket.findOne({
        order: [['ticketNumber', 'DESC']],
        attributes: ['ticketNumber'],
    });

    if (latestTicket) {
        // If tickets exist, increment the latest number
        return latestTicket.ticketNumber + 1;
    } else {
        // If no tickets exist, start from 1000
        return 1000;
    }
};

// --- API Endpoints ---

// API 1: Get all support tickets
exports.getSupportTickets = async (req, res) => {
    try {
        const { user } = req;
        let whereClause = {};
        const adminRoles = ['company_admin', 'revenue_manager', 'general_manager', 'analyst'];

        // Correctly check if user.Role exists and access its name
        const userRoleName = user && user.Role ? user.Role.name : null;

        if (!user || !adminRoles.includes(userRoleName)) {
            whereClause.userId = user.id;
        }

        const tickets = await db.SupportTicket.findAll({
            where: whereClause,
            include: [
                { model: db.User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ success: true, tickets });
    } catch (error) {
        sendErrorResponse(res, 500, 'Failed to fetch support tickets', error);
    }
};

// API 2: Create a new support ticket (with background email sending)
exports.createSupportTicket = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return sendErrorResponse(res, 400, `Multer error: ${err.message}`);
            }
            return sendErrorResponse(res, 400, err.message);
        }

        try {
            const { subject, category, description, priority } = req.body;
            const { user } = req;

            const superAdminUser = await db.User.findOne({
                include: [
                    {
                        model: db.Role,
                        as: 'Role',
                        where: { name: 'super_admin' },
                    },
                ],
                attributes: ['id', 'name', 'email'],
            });

            if (!subject || !description) {
                return sendErrorResponse(res, 400, 'Subject and description are required.');
            }

            // Get the next available ticket number
            const ticketNumber = await getNextTicketNumber();

            const fileAttachmentPath = req.file ? `/uploads/support_tickets/${req.file.filename}` : null;

            // Create new ticket
            const newTicket = await db.SupportTicket.create({
                userId: user.id,
                assignedTo: superAdminUser ? superAdminUser.id : null,
                ticketNumber: ticketNumber,
                subject,
                category,
                description,
                status: 'Open',
                priority: priority || 'Medium',
                fileAttachmentPath,
            });

            // Notify assigned admin
            if (superAdminUser) {
                await db.Notification.create({
                    user_id: superAdminUser.id,
                    title: 'New Support Ticket Created',
                    message: `User ${user.name} has created a new support ticket (#${newTicket.ticketNumber}).`,
                    type: 'ticket_created',
                    link: `/admin/support-ticket-management/${newTicket.id}/edit`,
                    is_read: false,
                });
            }

            // ✅ Send success response immediately
            res.status(201).json({
                success: true,
                message: 'Support ticket created successfully.',
                ticket: newTicket,
            });

            // --- 📧 Background Email Sending ---
            (async () => {
                try {
                    const frontendBaseUrl = process.env.FRONTEND_URL;
                    const userTicketLink = `${frontendBaseUrl}/support-tickets-edit/${newTicket.id}`;
                    const adminTicketLink = `${frontendBaseUrl}/admin/support-ticket-management/${newTicket.id}/edit`;

                    const userEmailData = getUserSupportTicketEmail(
                        user.name,
                        newTicket.ticketNumber,
                        newTicket.subject,
                        userTicketLink
                    );

                    const adminEmail = process.env.ADMIN_EMAIL || 'vipat51243@evoxury.com';
                    const adminEmailData = getAdminSupportTicketEmail(
                        user.name,
                        user.email,
                        newTicket.ticketNumber,
                        newTicket.subject,
                        newTicket.description,
                        adminTicketLink
                    );

                    // Send both emails in parallel (background)
                    await Promise.all([
                        (user.email, userEmailData.subject, userEmailData.html),
                        (adminEmail, adminEmailData.subject, adminEmailData.html),
                    ]);
                } catch (emailError) {
                    console.error('Background email sending failed:', emailError);
                }
            })();

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            sendErrorResponse(res, 500, 'Failed to create support ticket', error);
        }
    });
};



// API 3: Get a single support ticket by ID (with its thread)
exports.getSupportTicketDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req;

        const ticket = await db.SupportTicket.findByPk(id, {
            include: [
                { model: db.User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
                {
                    model: db.SupportTicketThread,
                    as: 'messages',
                    include: [
                        { model: db.User, as: 'sender', attributes: ['id', 'name', 'email'] }
                    ],
                    order: [['createdAt', 'ASC']],
                }
            ],
        });

        if (!ticket) {
            return sendErrorResponse(res, 404, 'Support ticket not found.');
        }

        const adminRoles = ['company_admin', 'revenue_manager', 'general_manager', 'analyst'];
        const userRoleName = user && user.Role ? user.Role.name : null;

        if (!user || (!adminRoles.includes(userRoleName) && ticket.userId !== user.id)) {
            return sendErrorResponse(res, 403, 'You are not authorized to view this ticket.');
        }

        res.status(200).json({ success: true, ticket });
    } catch (error) {
        sendErrorResponse(res, 500, 'Failed to fetch support ticket details', error);
    }
};

// API 4: Update an existing support ticket
exports.updateSupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, category, description, status, priority, assignedTo } = req.body;
        const { user } = req;

        const ticket = await db.SupportTicket.findByPk(id);

        if (!ticket) {
            return sendErrorResponse(res, 404, 'Support ticket not found.');
        }

        const adminRoles = ['company_admin', 'revenue_manager', 'general_manager', 'analyst'];
        const userRoleName = user && user.Role ? user.Role.name : null;

        if (!user || !adminRoles.includes(userRoleName)) {
            return sendErrorResponse(res, 403, 'You are not authorized to update this ticket.');
        }

        const updateData = {};
        if (subject) updateData.subject = subject;
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (assignedTo) updateData.assignedTo = assignedTo;

        await ticket.update(updateData);

        res.status(200).json({ success: true, message: 'Support ticket updated successfully.', ticket });
    } catch (error) {
        sendErrorResponse(res, 500, 'Failed to update support ticket', error);
    }
};

// API 5: Delete a support ticket
exports.deleteSupportTicketDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req;

        const ticket = await db.SupportTicket.findByPk(id);

        if (!ticket) {
            return sendErrorResponse(res, 404, 'Support ticket not found.');
        }

        // Delete associated files first (if any)
        if (ticket.fileAttachmentPath) {
            const filePath = path.join(__dirname, '..', ticket.fileAttachmentPath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete all associated thread messages and their files
        const messages = await db.SupportTicketThread.findAll({ where: { ticketId: id } });
        for (const message of messages) {
            if (message.fileAttachmentPath) {
                const filePath = path.join(__dirname, '..', message.fileAttachmentPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }
        await db.SupportTicketThread.destroy({ where: { ticketId: id } });

        if (ticket.assignedTo) {
            await db.Notification.create({
                user_id: ticket.assignedTo,
                title: 'Support Ticket Deleted',
                message: `User ${user.name} has deleted support ticket (#${ticket.ticketNumber}).`,
                type: 'ticket_deleted',
                link: '', // optional
                is_read: false,
            });
        }

        await ticket.destroy();

        res.status(200).json({ success: true, message: 'Support ticket and all associated threads deleted successfully.' });
    } catch (error) {
        sendErrorResponse(res, 500, 'Failed to delete support ticket', error);
    }
};

// --- API for Managing Chat Threads ---

// API 6: Add a new message (reply) to a support ticket thread
exports.addSupportTicketMessage = (req, res) => {
    uploadThreadFile(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return sendErrorResponse(res, 400, `Multer error: ${err.message}`);
            }
            return sendErrorResponse(res, 400, err.message);
        }

        try {
            const { id: ticketId } = req.params;
            const { message } = req.body;
            const { user } = req;

            if (!message && !req.file) {
                return sendErrorResponse(res, 400, 'Message or file attachment is required.');
            }

            const ticket = await db.SupportTicket.findByPk(ticketId);
            if (!ticket) {
                return sendErrorResponse(res, 404, 'Support ticket not found.');
            }

            const adminRoles = ['company_admin', 'revenue_manager', 'general_manager', 'analyst'];
            const userRoleName = user && user.Role ? user.Role.name : null;

            if (!user || (!adminRoles.includes(userRoleName) && ticket.userId !== user.id)) {
                return sendErrorResponse(res, 403, 'You are not authorized to reply to this ticket.');
            }

            const fileAttachmentPath = req.file ? `/uploads/support_tickets/${req.file.filename}` : null;

            const newMessage = await db.SupportTicketThread.create({
                ticketId: ticketId,
                senderId: user.id,
                message,
                fileAttachmentPath,
            });

            // Inside addSupportTicketMessage, when a user replies
            if (ticket.assignedTo) {
                await db.Notification.create({
                    user_id: ticket.assignedTo,
                    title: 'User Replied to Support Ticket',
                    message: `User ${user.name} replied to ticket (#${ticket.ticketNumber}).`,
                    type: 'ticket_reply',
                    link: `/admin/support-ticket-management/${ticket.id}/edit`,
                    is_read: false,
                });
            }

            
            if (ticket.status === 'Closed' && user && adminRoles.includes(userRoleName)) {
                await ticket.update({ status: 'Reopened' });
            }

            res.status(201).json({ success: true, message: 'Message added to thread successfully.', threadMessage: newMessage });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            sendErrorResponse(res, 500, 'Failed to add message to thread', error);
        }
    });
};