// models/supportTicket.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SupportTicket = sequelize.define('SupportTicket', {
        id: {
            type: DataTypes.UUID, // Changed to UUID
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        userId: { // User who created the ticket
            type: DataTypes.UUID, // Changed to UUID
            allowNull: false,
            references: {
                model: 'Users', // Matches your User model's default table name
                key: 'id',
            }
        },
        ticketNumber: { // User who created the ticket
            type: DataTypes.INTEGER, // Changed to UUID
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Open', // e.g., 'Open', 'Pending', 'Closed', 'Resolved'
        },
        priority: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Medium', // e.g., 'Low', 'Medium', 'High', 'Urgent'
        },
        assignedTo: { // User (admin/agent) assigned to the ticket
            type: DataTypes.UUID, // Changed to UUID
            allowNull: true,
            references: {
                model: 'Users', // Matches your User model's default table name
                key: 'id',
            }
        },
        fileAttachmentPath: { // Path to the uploaded file for the initial ticket
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        timestamps: true,
        tableName: 'SupportTicket', // Optional: Define the table name explicitly
    });

    SupportTicket.associate = (models) => {
        SupportTicket.belongsTo(models.User, { foreignKey: 'userId', as: 'creator' });
        SupportTicket.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignee' });
        SupportTicket.hasMany(models.SupportTicketThread, { foreignKey: 'ticketId', as: 'messages' });
    };

    return SupportTicket;
};