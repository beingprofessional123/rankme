// emailTemplate/UserSupportTicket.js

// It's good practice to define the logo URL dynamically or as a constant if it's reused.
const logoUrl = `${process.env.FRONTEND_URL}/user/images/logo.png`;

const getUserSupportTicketEmail = (userName, ticketNumber, subject, ticketLink) => {
  const emailSubject = `Confirmation: Your Support Ticket #${ticketNumber} has been received`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Rank Me Now</title>
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
            <a href="${process.env.FRONTEND_URL}" style="display: inline-block; width: 160px;"><img src="${logoUrl}" class="img-fluid" alt="Rank Me Now Logo" style="max-width: 100%; height: auto;"></a>
          </div>
          <div class="mail-docu" style="padding: 28px 36px 36px 36px;border-radius: 2px;background: #17237E;text-align: center;margin-bottom: 20px;">
            <h2 style="font-weight: 600;font-size: 20px;line-height: 24px;color: #fff;margin-bottom: 12px;margin-top: 0px;">Hello ${userName},</h2>
            <p style="font-weight: 500;font-size: 16px;line-height: 24px;color: #fff;margin-bottom: 22px;margin-top: 0px;">Thank you for reaching out to us! We've successfully received your support ticket and will get back to you shortly.</p>
            <p style="font-weight: 500;font-size: 16px;line-height: 24px;color: #fff;margin-bottom: 22px;margin-top: 0px;">Your Ticket Details:</p>
            <ul style="list-style: none; padding: 0; margin: 0; text-align: left; color: #fff;">
                <li style="margin-bottom: 8px;"><strong>Ticket Number:</strong> #${ticketNumber}</li>
                <li style="margin-bottom: 8px;"><strong>Subject:</strong> ${subject}</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticketLink}" style="display: inline-block; padding: 12px 24px; background:linear-gradient(50deg, rgba(90, 192, 93, 1)); color: white; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: 600;">
                View Your Ticket
              </a>
            </div>

            <p style="text-align: left; font-weight: 400;font-size: 16px;line-height: 24px;color: #fff;margin-bottom: 0px;margin-top: 10px;">We'll notify you when there's an update to your ticket.</p>
          </div>
          <div class="namemail">
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

  return { subject: emailSubject, html };
};

module.exports = getUserSupportTicketEmail;