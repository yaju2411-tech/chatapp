import { User } from "../models/User.js";
import { getIo } from "./socketServer.js";

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

        // ==================== 1-1 Call ====================
        // Caller -> Receiver
        socket.on("call-user", ({ receiverId, caller, callType }) => {
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                getIo().to(receiverSocket).emit("incoming-call", { caller, callType });
            }
        });
        // Receiver accepted
        socket.on("accept-call", ({ callerId }) => {
            const callerSocket = onlineUsers.get(callerId);
            if (callerSocket) {
                getIo().to(callerSocket).emit("call-accepted");
            }
        });
        // Receiver rejected
        socket.on("reject-call", ({ callerId }) => {
            const callerSocket = onlineUsers.get(callerId);
            if (callerSocket) {
                getIo().to(callerSocket).emit("call-rejected");
            }
        });
        // End Call
        socket.on("end-call", ({ receiverId, ...rest }) => {
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                getIo().to(receiverSocket).emit("call-ended", rest);
            }
        });
        socket.on("recover-ready", ({ targetUserId, callType }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("restart-webrtc");
        });
        socket.on("recover-call", ({ targetUserId, callType }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("call-recovering", { callType });
        });
        // ====================1-1 WebRTC Signaling ====================
        // Caller -> Receiver
        socket.on("webrtc-offer", ({ targetUserId, offer }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("webrtc-offer", { offer });
            }
        });
        // Receiver -> caller
        socket.on("webrtc-answer", ({ targetUserId, answer }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("webrtc-answer", { answer });
            }
        });
        //ice-candidate
        socket.on("ice-candidate", ({ targetUserId, candidate }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("ice-candidate", { candidate, });
            }
        });
        socket.on("switch-to-video-call", ({ receiverId }) => {
            const targetSocket = onlineUsers.get(receiverId);
            if (targetSocket) {
                io.to(targetSocket).emit("switch-to-video-call");
            }
        });

        //==============Group calling socket===============
        // User starts a group call
        socket.on("start-group-call", ({ conversationId, caller, callType }) => {
            socket.join(`call-${conversationId}`);
            io.to(conversationId).emit("group-call-started", {
                conversationId, caller, callType,
            });
        });
        // User joins existing call
        socket.on("join-group-call", ({ conversationId, user }) => {
            socket.join(`call-${conversationId}`);
            io.to(`call-${conversationId}`).emit("group-user-joined", {
                conversationId, user,
            });
        });
        // User leaves call
        socket.on("leave-group-call", ({ conversationId, user }) => {
            socket.leave(`call-${conversationId}`);
            io.to(`call-${conversationId}`).emit("group-user-left", {
                conversationId, user,
            });
        });
        // End call
        socket.on("end-group-call", ({ conversationId }) => {
            io.to(`call-${conversationId}`).emit("group-call-ended", {
                conversationId,
            });
            io.to(conversationId).emit("group-call-ended", {
                conversationId,
            });
        });
        // Invite user to group call
        socket.on("invite-to-group-call", ({ targetUserId, conversationId, caller, callType }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("group-call-started", {
                    conversationId, caller, callType,
                });
            }
        });
        //==============Group calling webrtc===============
        // Send offer to one participant
        socket.on("group-webrtc-offer", ({ targetUserId, senderId, sender, offer }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("group-webrtc-offer", {
                senderId, sender, offer
            });
        });
        // Send answer
        socket.on("group-webrtc-answer", ({ targetUserId, senderId, sender, answer }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("group-webrtc-answer", {
                senderId, sender, answer
            });
        });
        // ICE Candidate
        socket.on("group-ice-candidate", ({ targetUserId, senderId, candidate }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("group-ice-candidate", {
                senderId, candidate
            });
        });
        // Group call controls propagation
        socket.on("group-toggle-mute", ({ conversationId, userId, isMuted }) => {
            io.to(`call-${conversationId}`).emit("group-toggle-mute", { userId, isMuted });
        });
        socket.on("group-toggle-video", ({ conversationId, userId, isVideoOff }) => {
            io.to(`call-${conversationId}`).emit("group-toggle-video", { userId, isVideoOff });
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