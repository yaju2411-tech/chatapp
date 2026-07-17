import { User } from "../models/User.js";
import { getIo } from "./socketServer.js";
import { sendOfflineCallEmail } from "../service/mailService.js";

export const onlineUsers = new Map();
// Track which users are currently in an active call
const usersInCall = new Set();

const broadcastBusyUsers = () => {
    getIo().emit("busy-users-update", Array.from(usersInCall));
};

export const setupSocket = () => {
    const io = getIo();
    const reconnectTimers = new Map();
    const disconnectTimeouts = new Map();
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

        // ==================== 1-to-1 Call Signaling ====================
        // Get busy users list
        socket.on("get-busy-users", () => {
            socket.emit("busy-users-update", Array.from(usersInCall));
        });

        // Start Call: checks busy, joins room and sends incoming-call to target members
        socket.on("start-call", ({ conversationId, caller, callType, targetUserIds }) => {
            // Check if any target is busy before doing anything
            if (Array.isArray(targetUserIds) && targetUserIds.some(id => usersInCall.has(id))) {
                socket.emit("user-busy", { targetUserIds });
                return;
            }
            usersInCall.add(caller._id);
            socket.join(`call-${conversationId}`);
            if (Array.isArray(targetUserIds)) {
                targetUserIds.forEach(targetId => {
                    const targetSocket = onlineUsers.get(targetId);
                    if (targetSocket) {
                        getIo().to(targetSocket).emit("incoming-call", { conversationId, caller, callType });
                    }
                });
            }
            broadcastBusyUsers();
        });

        // Join Call: marks user busy, joins room, notifies other active participants
        socket.on("join-call", ({ conversationId, user }) => {
            if (disconnectTimeouts.has(user._id)) {
                clearTimeout(disconnectTimeouts.get(user._id));
                disconnectTimeouts.delete(user._id);
            }
            usersInCall.add(user._id);
            socket.join(`call-${conversationId}`);
            socket.to(`call-${conversationId}`).emit("user-joined", { user });
            broadcastBusyUsers();
        });

        // Leave Call: unmarks user busy, leaves room, notifies other active participants
        socket.on("leave-call", ({ conversationId, userId }) => {
            usersInCall.delete(userId);
            socket.leave(`call-${conversationId}`);
            getIo().to(`call-${conversationId}`).emit("user-left", { userId });
            broadcastBusyUsers();
        });

        // Cancel Call: notifies target users to close their incoming call dialogs
        socket.on("cancel-call", ({ targetUserIds, conversationId }) => {
            if (Array.isArray(targetUserIds)) {
                targetUserIds.forEach(targetId => {
                    const targetSocket = onlineUsers.get(targetId);
                    if (targetSocket) {
                        getIo().to(targetSocket).emit("call-cancelled", { conversationId });
                    }
                });
            }
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

        // ==================== Group Call Signaling ====================
        // Start Group Call: joins room, alerts online group members via socket, sends email to offline ones
        socket.on("start-group-call", async ({ conversationId, caller, callType, targetUserIds }) => {
            usersInCall.add(caller._id);
            socket.join(`call-${conversationId}`);
            if (Array.isArray(targetUserIds)) {
                for (const targetId of targetUserIds) {
                    const targetSocket = onlineUsers.get(targetId);
                    if (targetSocket) {
                        // If target is busy, notify caller instead of ringing them
                        if (usersInCall.has(targetId)) {
                            socket.emit("user-busy", { targetUserIds: [targetId] });
                        } else {
                            getIo().to(targetSocket).emit("group-incoming-call", { conversationId, caller, callType });
                        }
                    } else {
                        // User is offline! Send email notification of the group call using mailService
                        await sendOfflineCallEmail({ targetId, caller, conversationId });
                    }
                }
            }
            broadcastBusyUsers();
        });

        // Join Group Call: marks user busy, joins room, notifies other active participants
        socket.on("join-group-call", ({ conversationId, user }) => {
            if (disconnectTimeouts.has(user._id)) {
                clearTimeout(disconnectTimeouts.get(user._id));
                disconnectTimeouts.delete(user._id);
            }
            usersInCall.add(user._id);
            socket.join(`call-${conversationId}`);
            socket.to(`call-${conversationId}`).emit("group-user-joined", { user });
            broadcastBusyUsers();
        });

        // Invite a single user to an existing group call (does NOT re-notify all members)
        socket.on("invite-to-group-call", async ({ conversationId, caller, callType, targetUserId }) => {
            if (usersInCall.has(targetUserId)) {
                socket.emit("user-busy", { targetUserIds: [targetUserId] });
                return;
            }
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("group-incoming-call", { conversationId, caller, callType });
            } else {
                await sendOfflineCallEmail({ targetId: targetUserId, caller, conversationId });
            }
        });

        // Leave Group Call: unmarks user busy, leaves room, notifies other active participants
        socket.on("leave-group-call", ({ conversationId, userId }) => {
            usersInCall.delete(userId);
            socket.leave(`call-${conversationId}`);
            getIo().to(`call-${conversationId}`).emit("group-user-left", { userId });
            broadcastBusyUsers();
        });

        // Cancel Group Call: notifies target users to close their incoming call dialogs
        socket.on("cancel-group-call", ({ targetUserIds, conversationId }) => {
            if (Array.isArray(targetUserIds)) {
                targetUserIds.forEach(targetId => {
                    const targetSocket = onlineUsers.get(targetId);
                    if (targetSocket) {
                        getIo().to(targetSocket).emit("group-call-cancelled", { conversationId });
                    }
                });
            }
        });

        // Group WebRTC SDP Offer forwarding
        socket.on("group-webrtc-offer", ({ targetUserId, ...rest }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("group-webrtc-offer", rest);
            }
        });

        // Group WebRTC SDP Answer forwarding
        socket.on("group-webrtc-answer", ({ targetUserId, ...rest }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("group-webrtc-answer", rest);
            }
        });

        // Group WebRTC ICE Candidate forwarding
        socket.on("group-ice-candidate", ({ targetUserId, ...rest }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                getIo().to(targetSocket).emit("group-ice-candidate", rest);
            }
        });

        // Toggle Group Microphone propagation
        socket.on("toggle-group-mic", ({ conversationId, userId, isMuted }) => {
            getIo().to(`call-${conversationId}`).emit("group-user-toggle-mic", { userId, isMuted });
        });

        // Toggle Group Camera propagation
        socket.on("toggle-group-camera", ({ conversationId, userId, isVideoOff }) => {
            getIo().to(`call-${conversationId}`).emit("group-user-toggle-camera", { userId, isVideoOff });
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
            if (disconnectedUserId) {
                // 15-second grace period before clearing them from the busy list
                const timeoutId = setTimeout(() => {
                    usersInCall.delete(disconnectedUserId);
                    broadcastBusyUsers();
                    disconnectTimeouts.delete(disconnectedUserId);
                }, 15000);
                disconnectTimeouts.set(disconnectedUserId, timeoutId);
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