const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const db = require('../../models');
const { } = require('../../utils/mailer');
const getStatusUpdateEmail = require('../../emailTemplate/UserStatusSupportTicket');


const supportTicketController = {
    // Controller to get a list of all support tickets
    listTickets: async (req, res) => {
        try {
            const tickets = await db.SupportTicket.findAll({
                include: [
                    {
                        model: db.User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email', 'profile'],
                        include: [
                            {
                                model: db.Company,
                                attributes: ['id', 'logo_url'], // adjust fields as per your Company model
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'assignee',
                        attributes: ['id', 'name', 'email', 'profile'],
                        include: [
                            {
                                model: db.Company,
                                attributes: ['id', 'logo_url'], // adjust fields as per your Company model
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json({ status: true, tickets });
        } catch (error) {
            console.error('Error fetching support tickets:', error);
            return res.status(500).json({ status: false, message: 'Failed to fetch tickets.' });
        }
    },

    // Controller to get a single support ticket by its ID
    getTicketById: async (req, res) => {
        const { id } = req.params;
        try {
            const ticket = await db.SupportTicket.findByPk(id, {
                include: [
                    {
                        model: db.User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email', 'profile'],
                        include: [
                            {
                                model: db.Company,
                                attributes: ['id', 'logo_url'], // adjust fields as per your Company model
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'assignee',
                        attributes: ['id', 'name', 'email', 'profile'],
                        include: [
                            {
                                model: db.Company,
                                attributes: ['id', 'logo_url'], // adjust fields as per your Company model
                            }
                        ]
                    },
                    {
                        // CORRECTED: Using the correct model name `SupportTicketThread`
                        model: db.SupportTicketThread,
                        as: 'messages',
                        include: [
                            {
                                model: db.User,
                                as: 'sender',
                                attributes: ['id', 'name', 'email', 'profile']
                            }
                        ],
                        order: [['createdAt', 'ASC']]
                    }
                ]
            });

            if (!ticket) {
                return res.status(404).json({ status: false, message: 'Ticket not found.' });
            }

            return res.status(200).json({ status: true, ticket });
        } catch (error) {
            console.error('Error fetching support ticket details:', error);
            return res.status(500).json({ status: false, message: 'Failed to fetch ticket details.' });
        }
    },

    // Controller to update a support ticket and add a new message
    updateTicket: async (req, res) => {
        const { id } = req.params;
        const { message, status, assigneeId } = req.body;
        const file = req.file;
        const senderId = req.user.id;

        try {
            const ticket = await db.SupportTicket.findByPk(id, {
                include: [
                    {
                        model: db.User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email', 'profile']
                    }
                ]
            });

            if (!ticket) {
                return res.status(404).json({ status: false, message: 'Ticket not found.' });
            }

            const oldStatus = ticket.status;
            const updateFields = {};
            if (status) updateFields.status = status;
            if (assigneeId) updateFields.assigneeId = assigneeId;

            await ticket.update(updateFields);

            // --- Add new message if provided ---
            if (message || file) {
                const messageData = {
                    ticketId: id,
                    senderId,
                    message: message || '',
                    fileAttachmentPath: file ? `/uploads/support_tickets/${file.filename}` : null
                };
                await db.SupportTicketThread.create(messageData);

                await db.Notification.create({
                    user_id: ticket.userId,
                    title: 'New Reply from Admin',
                    message: `Your support ticket (#${ticket.ticketNumber}) has a new reply from admin.`,
                    type: 'ticket_new_reply',
                    link: `/support-tickets-edit/${ticket.id}`,
                    is_read: false
                });
            }

            // ✅ Send immediate response to frontend first
            res.status(200).json({ status: true, message: 'Ticket updated successfully.' });

            // 🔄 Background async operations start here (non-blocking)
            (async () => {
                try {
                    // If status changed → send status update email
                    if (status && status !== oldStatus) {
                        const frontendBaseUrl = process.env.FRONTEND_URL;
                        const userTicketLink = `${frontendBaseUrl}/support-tickets-edit/${ticket.id}`;
                        const userEmailData = getStatusUpdateEmail(
                            ticket.creator.name,
                            ticket.ticketNumber,
                            ticket.subject,
                            status,
                            userTicketLink
                        );

                        await (ticket.creator.email, userEmailData.subject, userEmailData.html);

                        await db.Notification.create({
                            user_id: ticket.userId,
                            title: 'Support Ticket Status Updated',
                            message: `Your support ticket (#${ticket.ticketNumber}) status has been updated to "${status}".`,
                            type: 'ticket_status_updated',
                            link: `/support-tickets-edit/${ticket.id}`,
                            is_read: false
                        });
                    }
                } catch (emailErr) {
                    console.error('Background email or notification error:', emailErr);
                }
            })();

        } catch (error) {
            console.error('Error updating support ticket:', error);
            return res.status(500).json({ status: false, message: 'Failed to update ticket.' });
        }
    },

    // Controller to delete a support ticket
    deleteTicket: async (req, res) => {
        const { id } = req.params;

        try {
            // Find the ticket to check if it exists
            const ticket = await db.SupportTicket.findByPk(id);

            if (!ticket) {
                return res.status(404).json({ status: false, message: 'Ticket not found.' });
            }

            // Find and delete associated messages and their files
            const messages = await db.SupportTicketThread.findAll({ where: { ticketId: id } });

            for (const msg of messages) {
                if (msg.fileAttachmentPath) {
                    const filePath = path.join(__dirname, '../../..', msg.fileAttachmentPath);
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error(`Failed to delete file at ${filePath}:`, err);
                            }
                        });
                    } else {
                        console.warn(`File not found, skipping deletion: ${filePath}`);
                    }
                }
                await msg.destroy();
            }

            await db.Notification.create({
                user_id: ticket.userId,
                title: 'Support Ticket Deleted',
                message: `Your support ticket (#${ticket.ticketNumber}) with subject "${ticket.subject}" has been deleted by the admin.`,
                type: 'ticket_deleted',
                link: null, // Optional: link to support page
                is_read: false
            });

            // Now delete the ticket itself
            await ticket.destroy();

            return res.status(200).json({ status: true, message: 'Ticket deleted successfully.' });
        } catch (error) {
            console.error('Error deleting support ticket:', error);
            return res.status(500).json({ status: false, message: 'Failed to delete ticket.' });
        }
    }
};

module.exports = supportTicketController;