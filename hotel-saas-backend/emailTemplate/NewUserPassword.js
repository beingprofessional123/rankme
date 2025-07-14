// emailTemplate/NewUserPassword.js

const getNewUserPasswordEmail = (userName, userEmail, temporaryPassword, loginUrl) => {
  const subject = 'Your New Account Details and Temporary Password';
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>mybestdm</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        body {
          font-family: 'Montserrat', sans-serif;
          margin: 0px;
          background: #fff;
        }
      </style>
    </head>
    <body>

    <div class="mail-messages-body-top" style="width: 640px;margin: 50px auto;">
      <div class="mail-messages-body" style="padding: 20px;background: #eaeaea;">

        <div class="mail-messages" style="background: #FFFFFF;padding: 30px;">
          <div class="mail-logo" style="margin-bottom: 20px;">
            <a href="${loginUrl}" style="display: inline-block; width: 160px;"><img src="${process.env.FRONTEND_URL}/user/images/logo.png" class="img-fluid" alt="Rank Me Now Logo" style="max-width: 100%; height: auto;"></a>
          </div>
          <div class="mail-docu" style="padding: 28px 36px 36px 36px;border-radius: 2px;background: #17237E;text-align: center;margin-bottom: 20px;">
            <h2 style="font-weight: 600;font-size: 20px;line-height: 24px;color: #fff;margin-bottom: 12px;margin-top: 0px;">Welcome to Our Service, ${userName}!</h2>
            <p style="font-weight: 500;font-size: 16px;line-height: 24px;color: #fff;margin-bottom: 22px;margin-top: 0px;">Your account has been successfully created with the following details:</p>
            <ul style="margin: 0px 0px 20px 0px;padding: 0px;list-style: none;text-align: left;color: #fff;">
              <li style="font-weight: 400;margin-bottom: 8px;"><strong style="font-weight: 600;margin-right: 10px;">Email:</strong> ${userEmail}</li>
              <li style="font-weight: 400;margin-bottom: 8px;"><strong style="font-weight: 600;margin-right: 10px;">Temporary Password:</strong> ${temporaryPassword}</li>
            </ul>
            <p style="text-align: left; font-weight: 400;font-size: 16px;line-height: 24px;color: #fff;margin-bottom: 0px;margin-top: 0px;">For security reasons, we strongly recommend that you log in and change your password immediately.</p>
          </div>
          <div class="namemail">
            <a href="${loginUrl}?email=${userEmail}&password=${temporaryPassword}" style="color: #458dfc;margin: 0px 0px 10px 0px;display: block;">Login to Your Account</a>
            <p style="font-size: 14px;margin: 0px 0px 7px 0px;color: #000;">If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
        </div>

        <div class="mail-messages-bottom" style="padding: 30px;">
          <div class="footer">
            <h3 style="margin: 0px 0px 7px 0px;font-size: 14px;font-weight: 600;color: #000;">Best regards,</h3>
            <p style="font-size: 14px;margin: 0px;color: #000;">Rank Me Now Team</p>
          </div>
        </div>
      </div>
    </div>
    </body>
    </html>
  `;

  return { subject, html };
};

module.exports = getNewUserPasswordEmail;