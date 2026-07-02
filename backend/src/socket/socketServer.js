import { Server } from "socket.io";
let io;

const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_PROD,
].filter(Boolean);

export const initSocket = (httpServer) => {
    io = new Server(httpServer,{
        cors:{
            origin:allowedOrigins,
            credentials:true,
            methods:["GET","POST"]
        }
    });
    return io;
};

export const getIo = () => {
    if(!io){
        throw new Error("Socket.io not initialized");
    }
    return io;
};