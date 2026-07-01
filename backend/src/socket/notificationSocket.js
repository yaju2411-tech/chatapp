import { getIo } from "./socketServer.js";
import { onlineUsers } from "./socket.js";

export const sendNotificationEmit = (receiverId,notification) => {
    const io = getIo();
    const socketId = onlineUsers.get(receiverId.toString());

    if(socketId){
        io.to(socketId).emit("new-notification",notification);
    }
};