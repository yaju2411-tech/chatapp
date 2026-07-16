import { User } from "../models/User.js";
import { getIo } from "./socketServer.js";
import { transporter, getMailSender } from "../config/nodemailer.js";

export const onlineUsers = new Map();

export const setupSocket = () => {
    const io = getIo();
    const reconnectTimers = new Map();
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);
        //setup
        socket.on("setup", async (userId) => {
            onlineUsers.set(userId, socket.id);
            if (reconnectTimers.has(userId)) {
                clearTimeout(reconnectTimers.get(userId));
                reconnectTimers.delete(userId);
                console.log("reconnsect timer is cancelled", userId);
            }
            await User.findByIdAndUpdate(userId, {
                isOnline: true
            });
            socket.join(userId);
            io.emit("online-users", Array.from(onlineUsers.keys()));
        });
        // join chat
        socket.on("join-conversation", (conversationId) => {
            socket.join(conversationId);
        });
        // leave chat
        socket.on("leave-conversation", (conversationId) => {
            socket.leave(conversationId);
        });
        // typing
        socket.on("typing", (conversationId) => {
            socket.to(conversationId).emit("user-typing");
        });
        // stop typing
        socket.on("stop-typing", (conversationId) => {
            socket.to(conversationId).emit("user-stop-typing");
        });
        // seen messages
        socket.on("seen-message", ({ conversationId }) => {
            socket.to(conversationId).emit("messages-seen", conversationId);
        });
        //delete message
        socket.on("delete-message", (message) => {
            socket.to(message.conversation).emit("message-deleted", message);
        });

        // ==================== Unified Call Signaling ====================
        // Start Call: joins room and sends incoming-call to target members
        socket.on("start-call", async ({ conversationId, caller, callType, targetUserIds }) => {
            socket.join(`call-${conversationId}`);
            if (Array.isArray(targetUserIds)) {
                for (const targetId of targetUserIds) {
                    const targetSocket = onlineUsers.get(targetId);
                    if (targetSocket) {
                        getIo().to(targetSocket).emit("incoming-call", { conversationId, caller, callType });
                    } else {
                        // User is offline! Send email notification of the group call
                        try {
                            const recipient = await User.findById(targetId);
                            if (recipient && recipient.email) {
                                const clientUrl = process.env.NODE_ENV === "production"
                                    ? (process.env.CLIENT_URL_PROD || "https://chatapp-three-ecru.vercel.app")
                                    : (process.env.CLIENT_URL || "http://localhost:5173");

                                await transporter.sendMail({
                                    from: `"Chat App" <${getMailSender()}>`,
                                    to: recipient.email,
                                    subject: `Group Call Started by ${caller.name}`,
                                    html: `
                                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                            <h2>Incoming Group Call</h2>
                                            <p><strong>${caller.name}</strong> is calling you in a group chat.</p>
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
                                console.log(`Offline call notification email sent to ${recipient.email}`);
                            }
                        } catch (err) {
                            console.error("Failed to send offline call notification email:", err.message);
                        }
                    }
                }
            }
        });

        // Join Call: joins room and notifies other active participants
        socket.on("join-call", ({ conversationId, user }) => {
            socket.join(`call-${conversationId}`);
            socket.to(`call-${conversationId}`).emit("user-joined", { user });
        });

        // Leave Call: leaves room and notifies other active participants
        socket.on("leave-call", ({ conversationId, userId }) => {
            socket.leave(`call-${conversationId}`);
            getIo().to(`call-${conversationId}`).emit("user-left", { userId });
        });

        // WebRTC SDP Offer forwarding
        socket.on("webrtc-offer", ({ targetUserId, ...rest }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("webrtc-offer", rest);
            }
        });

        // WebRTC SDP Answer forwarding
        socket.on("webrtc-answer", ({ targetUserId, ...rest }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("webrtc-answer", rest);
            }
        });

        // WebRTC ICE Candidate forwarding
        socket.on("ice-candidate", ({ targetUserId, ...rest }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("ice-candidate", rest);
            }
        });

        // Toggle Microphone propagation
        socket.on("toggle-mic", ({ conversationId, userId, isMuted }) => {
            getIo().to(`call-${conversationId}`).emit("user-toggle-mic", { userId, isMuted });
        });

        // Toggle Camera propagation
        socket.on("toggle-camera", ({ conversationId, userId, isVideoOff }) => {
            getIo().to(`call-${conversationId}`).emit("user-toggle-camera", { userId, isVideoOff });
        });


        //disconnect
        socket.on("disconnect", async () => {
            let disconnectedUserId = null;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastSeen: new Date(),
                    });
                    break;
                }
            }
            io.emit("online-users", Array.from(onlineUsers.keys()));
            console.log("Disconnected:", socket.id);
            if (disconnectedUserId) {
                const timer = setTimeout(() => {
                    console.log("Reconnect timeout:", disconnectedUserId);
                    io.emit("call-ended", {
                        userId: disconnectedUserId,
                    });
                    reconnectTimers.delete(disconnectedUserId);
                }, 30000);
                reconnectTimers.set(disconnectedUserId, timer);
            }
        });
    });
};