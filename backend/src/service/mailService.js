import { transporter, getMailSender } from "../config/nodemailer.js";
import { User } from "../models/User.js";

/**
 * Sends an email notification to an offline user about a group call.
 */
export const sendOfflineCallEmail = async ({ targetId, caller, conversationId }) => {
    try {
        const recipient = await User.findById(targetId);
        const callerDoc = await User.findById(caller._id || caller);
        const callerName = callerDoc ? callerDoc.name : "A user";
        
        const escapeHtml = (unsafe) => {
            return String(unsafe)
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
         };
        const safeCallerName = escapeHtml(callerName);

        if (recipient && recipient.email) {
            const clientUrl = process.env.NODE_ENV === "production"
                ? (process.env.CLIENT_URL_PROD || "https://chatapp-three-ecru.vercel.app")
                : (process.env.CLIENT_URL || "http://localhost:5173");

            await transporter.sendMail({
                from: `"Chat App" <${getMailSender()}>`,
                to: recipient.email,
                subject: `Group Call Started by ${safeCallerName}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Incoming Group Call</h2>
                        <p><strong>${safeCallerName}</strong> is calling you in a group chat.</p>
                        <p>To join the call, please log in and come online:</p>
                        <div style="margin: 20px 0;">
                            <a href="${clientUrl}?chatId=${conversationId}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Join Group Call
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #777;">If you did not expect this call, you can safely ignore this email.</p>
                    </div>
                `
            });
            console.log("Offline call notification email sent successfully.");
            return true;
        }
    } catch (err) {
        console.error("Failed to send offline call notification email:", err.message);
    }
    return false;
};
