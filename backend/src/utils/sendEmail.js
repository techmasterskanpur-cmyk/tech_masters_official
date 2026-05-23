const { Resend } = require('resend');

// Safely initialize Resend only if the API key is provided
let resend;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
}

const sendEmail = async (options) => {
    try {
        if (!resend) {
            console.error("⚠️ Email not sent: RESEND_API_KEY is missing from environment variables.");
            return null; // Fail gracefully without crashing the order workflow
        }

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