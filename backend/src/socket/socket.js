import { User } from "../models/User.js";
import { getIo } from "./socketServer.js";

export const onlineUsers = new Map();

export const setupSocket = () => {
    const io = getIo();
    io.on("connection",(socket)=>{
        console.log("Socket connected:",socket.id);
        //setup
        socket.on("setup", async (userId)=>{
            onlineUsers.set(userId,socket.id);
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
        // ==================== Voice Call ====================
        // Caller -> Receiver
        socket.on("call-user", ({ receiverId, caller }) => {
            const receiverSocket = onlineUsers.get(receiverId);
            if (receiverSocket) {
                getIo().to(receiverSocket).emit("incoming-call", {caller,});
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
        // ==================== WebRTC Signaling ====================
        // Caller -> Receiver
        socket.on("webrtc-offer", ({ targetUserId, offer }) => {
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit("webrtc-offer", {offer,});
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
        socket.on("disconnect",async()=>{   
            for(const [userId,socketId] of onlineUsers.entries()){
                if(socketId === socket.id){
                    onlineUsers.delete(userId);
                    await User.findByIdAndUpdate(userId,{
                        isOnline:false,
                        lastSeen:new Date()
                    });
                    break;
                }
            }
            io.emit("online-users",Array.from(onlineUsers.keys()));
            console.log("Disconnected:",socket.id);
        });
    });
};