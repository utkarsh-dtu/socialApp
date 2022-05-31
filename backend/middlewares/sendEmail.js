const nodeMailer = require("nodemailer");

exports.sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    secure: false,
    port: process.env.SMPT_PORT,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },

    // service: process.env.SMPT_SERVICE,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};
