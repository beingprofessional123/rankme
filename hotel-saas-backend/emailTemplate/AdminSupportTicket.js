// emailTemplate/AdminSupportTicket.js

// It's good practice to define the logo URL dynamically or as a constant if it's reused.
const logoUrl = `${process.env.FRONTEND_URL}/user/images/logo.png`;

const getAdminSupportTicketEmail = (userName, userEmail, ticketNumber, subject, description, ticketLink) => {
  const emailSubject = `New Support Ticket - #${ticketNumber} from ${userName}`;

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
            <h2 style="font-weight: 600;font-size: 20px;line-height: 24px;color: #fff;margin-bottom: 12px;margin-top: 0px;">New Support Ticket</h2>
            <p style="font-weight: 500;font-size: 16px;line-height: 24px;color: #fff;margin-bottom: 22px;margin-top: 0px;">A new support ticket has been submitted. Here are the details:</p>
            <ul style="list-style: none; padding: 0; margin: 0; text-align: left; color: #fff;">
                <li style="margin-bottom: 8px;"><strong>Ticket Number:</strong> #${ticketNumber}</li>
                <li style="margin-bottom: 8px;"><strong>Submitted By:</strong> ${userName} (${userEmail})</li>
                <li style="margin-bottom: 8px;"><strong>Subject:</strong> ${subject}</li>
                <li style="margin-bottom: 8px;"><strong>Description:</strong> ${description}</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticketLink}" style="display: inline-block; padding: 12px 24px; background:linear-gradient(50deg, rgba(90, 192, 93, 1)); color: white; border-radius: 5px; text-decoration: none; font-size: 16px; font-weight: 600;">
                View Ticket Details
              </a>
            </div>
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

module.exports = getAdminSupportTicketEmail;