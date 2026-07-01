import { Server } from "socket.io";
let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer,{
        cors:{
            origin:"http://localhost:5173",
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