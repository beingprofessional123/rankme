// emailTemplate/NewUserPassword.js

const getNewUserPasswordEmail = (userName, userEmail, temporaryPassword, loginUrl) => {
  const subject = 'Your New Account Details and Temporary Password';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #0056b3;">Welcome to Our Service, ${userName}!</h2>
      <p>Your account has been successfully created with the following details:</p>
      <ul>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Temporary Password:</strong> <strong style="color: #d9534f;">${temporaryPassword}</strong></li>
      </ul>
      <p>For security reasons, we strongly recommend that you log in and change your password immediately.</p>
      <p style="margin-top: 20px;">
        <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Login to Your Account</a>
      </p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>Your Company Team</p>
    </div>
  `;

  return { subject, html };
};

module.exports = getNewUserPasswordEmail;