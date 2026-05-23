const { Resend } = require('resend');

// ✅ Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
    try {
        // Explicitly await the email sending to guarantee reliability
        const data = await resend.emails.send({
            from: 'Tech Masters Support <onboarding@resend.dev>', // Sender Name/Domain
            to: options.email,
            subject: options.subject,
            html: options.message, // HTML Body
        });

        console.log("✅ Resend Email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("❌ Resend API Error:", error);
        throw error;
    }
};

module.exports = sendEmail;