const nodemailer = require('nodemailer');

// ✅ Create transporter once for persistence (Singleton pattern)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // MUST be true for port 465 (Implicit TLS)
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
    // Add debug and timeout settings to prevent silent 2-minute hangs
    connectionTimeout: 10000, 
    greetingTimeout: 5000,
    socketTimeout: 20000,
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ SMTP Connection Error (Check Gmail App Password):", error);
    } else {
        console.log("✅ SMTP Server is ready to take our messages");
    }
});

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"Tech Masters Support" <${process.env.SMTP_EMAIL}>`, // Sender Name
            to: options.email,
            subject: options.subject,
            html: options.message, // HTML Body
        };

        // Explicitly await the email sending to guarantee reliability
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Nodemailer Error:", error);
    }
};

module.exports = sendEmail;