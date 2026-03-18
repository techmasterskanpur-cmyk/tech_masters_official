const nodemailer = require('nodemailer');

// ✅ Create transporter once for persistence (Singleton pattern)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"Tech Masters Support" <${process.env.SMTP_EMAIL}>`, // Sender Name
            to: options.email,
            subject: options.subject,
            html: options.message, // HTML Body
        };

        // Note: Transporter.sendMail is asynchronous, but we return the promise
        return transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Nodemailer Error:", error);
    }
};

module.exports = sendEmail;