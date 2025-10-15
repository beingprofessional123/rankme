// models/supportTicketThread.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SupportTicketThread = sequelize.define('SupportTicketThread', {
        id: {
            type: DataTypes.UUID, // Changed to UUID
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        ticketId: {
            type: DataTypes.UUID, // Changed to UUID (to match SupportTicket's ID)
            allowNull: false,
            references: {
                model: 'SupportTicket', // Matches SupportTicket's tableName if defined, or 'SupportTickets'
                key: 'id',
            },
        },
        senderId: { // User who sent the message (could be customer or admin)
            type: DataTypes.UUID, // Changed to UUID
            allowNull: false,
            references: {
                model: 'Users', // Matches your User model's default table name
                key: 'id',
            },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        fileAttachmentPath: { // Path to the uploaded file for this specific message
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        timestamps: true,
        tableName: 'SupportTicketThread', // Optional: Define the table name explicitly
    });

    SupportTicketThread.associate = (models) => {
        // A SupportTicketThread belongs to a SupportTicket
        SupportTicketThread.belongsTo(models.SupportTicket, { foreignKey: 'ticketId', as: 'ticket' });
        // A SupportTicketThread belongs to a User (sender)
        SupportTicketThread.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    };

    return SupportTicketThread;
};