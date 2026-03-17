const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Tech Masters Support" <${process.env.SMTP_EMAIL}>`, // Sender Name
        to: options.email,
        subject: options.subject,
        html: options.message, // HTML Body
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;