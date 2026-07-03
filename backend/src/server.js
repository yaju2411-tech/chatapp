import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "../src/config/db.js";
import session from "express-session";
import passport from "../src/config/passport.js";
import cookieParser from "cookie-parser";
import "../src/events/friendEvents.js";
import { initSocket } from "../src/socket/socketServer.js";
import { setupSocket } from "../src/socket/socket.js";

import friendRoutes from "./routes/friendRoutes.js";
import authRoutes from "../src/routes/authRoutes.js";
import adminRoutes from "../src/routes/adminRoutes.js";
import superadmin from "../src/routes/superAdminRoutes.js";
import conversationRoutes from "../src/routes/conversationRoutes.js";
import messageRoutes from "../src/routes/messageRoutes.js";
import notificationRoutes from "../src/routes/notificationRoutes.js";
import gifRoutes from "../src/routes/gifRoutes.js"

const app = express();
const httpServer = createServer(app);
//socket io setup
const io = initSocket(httpServer);
setupSocket();
const PORT = process.env.PORT;
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_PROD,
].filter(Boolean);

//default middleware
app.use(express.json());
app.use(cors({
    origin: allowedOrigins,
    credentials:true,
}));
//middleware for Oauth
app.use(cookieParser());
app.use(
    session({
        secret:process.env.SESSION_SECRET,
        resave:false,
        saveUninitialized:false
    }),
);
app.use(passport.initialize());
app.use(passport.session());
//home routes
app.get("/",(req,res)=>{
    res.send("Backend Working");
});
//user route
app.use("/api/auth",authRoutes);
//admin route
app.use("/api/admin",adminRoutes);
//super admin
app.use("/api/superadmin",superadmin);
//friend routes
app.use("/api/friends", friendRoutes);
//conversation routes
app.use("/api/conversation",conversationRoutes);
//messages
app.use("/api/message",messageRoutes);
//notifications
app.use("/api/notifications",notificationRoutes);
//gif routes
app.use("/api/gif",gifRoutes);

const startServer = async () => {
    try {
        await connectDB();
        httpServer.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
startServer();