import { User } from "../models/User.js";
import { getIo } from "./socketServer.js";

export const onlineUsers = new Map();

export const setupSocket = () => {
    const io = getIo();
    const reconnectTimers = new Map();  
    io.on("connection",(socket)=>{
        console.log("Socket connected:",socket.id);
        //setup
        socket.on("setup", async (userId)=>{
            onlineUsers.set(userId,socket.id);
            if(reconnectTimers.has(userId)){
                clearTimeout(reconnectTimers.get(userId));
                reconnectTimers.delete(userId);
                console.log("reconnsect timer is cancelled",userId);
            }
            await User.findByIdAndUpdate(userId,{
                isOnline:true
            });
            socket.join(userId);
            io.emit("online-users",Array.from(onlineUsers.keys()));
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
        socket.on("typing",(conversationId)=>{
            socket.to(conversationId).emit("user-typing");
        });
        // stop typing
        socket.on("stop-typing", (conversationId) => {
            socket.to(conversationId).emit("user-stop-typing");
        });
        // seen messages
        socket.on("seen-message", ({ conversationId }) => {
            socket.to(conversationId).emit("messages-seen",conversationId);
        });
        //delete message
        socket.on("delete-message",(message)=>{
            socket.to(message.conversation).emit("message-deleted",message);
        });
        // ==================== Call ====================
        // Caller -> Receiver
        socket.on("call-user", ({ receiverId, caller,callType }) => {
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                getIo().to(receiverSocket).emit("incoming-call", {caller,callType});
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
        socket.on("end-call", ({ receiverId }) => {
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                getIo().to(receiverSocket).emit("call-ended");
            }
        });
        socket.on("recover-ready", ({ targetUserId,callType }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("restart-webrtc");
        });
        socket.on("recover-call", ({ targetUserId, callType }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (!targetSocket) return;
            io.to(targetSocket).emit("call-recovering", { callType });
        });
        // ==================== WebRTC Signaling ====================
        // Caller -> Receiver
        socket.on("webrtc-offer", ({ targetUserId, offer }) => {
            console.log("Backend received offer");
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("webrtc-offer", { offer });
            }
        });
        // Receiver -> caller
        socket.on("webrtc-answer", ({ targetUserId, answer }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("webrtc-answer", {answer});
            }
        });
        //ice-candidate
        socket.on("ice-candidate", ({ targetUserId, candidate }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("ice-candidate", {candidate,});
            }
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