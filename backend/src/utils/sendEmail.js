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
            return null; 
        }

        console.log(`Attempting to send email to ${options.email} using Resend...`);

        // Destructure data and error from Resend response
        const { data, error } = await resend.emails.send({
            from: 'Tech Masters Support <onboarding@resend.dev>', // Resend testing sender
            to: options.email,
            subject: options.subject,
            html: options.message,
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            throw new Error(error.message);
        }

        console.log("✅ Resend Email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("❌ Email Delivery Failed:", error.message || error);
        throw error;
    }
};

module.exports = sendEmail;