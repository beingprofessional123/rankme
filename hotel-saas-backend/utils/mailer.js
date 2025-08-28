// utils/mailer.js
const nodemailer = require('nodemailer');

// Create a transporter using your email service provider's details
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_ENCRYPTION === 'SSL' || process.env.MAIL_PORT == 465, // Use 'true' for 465, 'false' for 587
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

// A function to send emails
const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`, // Sender address
            to: to, // List of receivers
            subject: subject, // Subject line
            html: html, // HTML body
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        return false;
    }
};

module.exports = { sendEmail };