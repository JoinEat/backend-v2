const config = require('../config');
const nodemailer = require('nodemailer');

module.exports = {
  sendTextToEmailAddress,
};

async function sendTextToEmailAddress (to, subject, text) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.email.user,
      pass: config.email.pass,
      clientId: config.email.clientId,
      clientSecret: config.email.clientSecret,
      refreshToken: config.email.refreshToken,
    }
  });

  let mailOptions = {
    from: config.email.user,
    to,
    subject,
    text,
  };

  return  transporter.sendMail(mailOptions);
}