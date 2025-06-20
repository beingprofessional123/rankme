const logoUrl = 'https://rankme-frontend.onrender.com/assets/images/logo.png';

const getForgotPasswordEmail = (userName, resetLink) => {
  const subject = 'Reset Your Password';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center;">
        <img src="${logoUrl}" alt="Company Logo" style="height: 50px; margin-bottom: 20px;" />
      </div>
      <h2 style="color: #333;">Hi ${userName},</h2>
      <p style="font-size: 16px; color: #555;">
        You recently requested to reset your password for your account. Click the button below to reset it.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        This password reset link will expire in 1 hour.
      </p>
      <p style="font-size: 14px; color: #777;">
        If you didn’t request a password reset, you can safely ignore this email.
      </p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} Your Company. All rights reserved.
      </p>
    </div>
  `;

  return { subject, html };
};

module.exports = getForgotPasswordEmail;
