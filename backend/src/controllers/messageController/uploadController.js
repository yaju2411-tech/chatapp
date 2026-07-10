import streamifier from "streamifier";
import cloudinary from "../../config/cloudinary.js";

import { Message } from "../../models/Message.js";
import { Conversation } from "../../models/Conversation.js";
import { createNotification } from "../../service/notificationService.js";
import { getIo } from "../../socket/socketServer.js";

const uploadBuffer = (buffer, folder, resource_type) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,resource_type,
            },
            (err, result) => {
                if (err) reject(err);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const uploadMediaMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const conversationId = req.params.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File missing",
            });
        }
        let resource_type = "raw";
        let messageType = "file";
        if (req.file.mimetype.startsWith("image/")) {
            resource_type = "image";
            messageType = "image";
        }
        else if (req.file.mimetype.startsWith("video/")) {
            resource_type = "video";
            messageType = "video";
        }
        else if (req.file.mimetype.startsWith("audio/")) {
            resource_type = "video";
            messageType = "audio";
        }
        const upload = await uploadBuffer(req.file.buffer,"chat-app",resource_type);
        const media = { image: "",video: "",audio: "",file: ""};
        media[messageType] = upload.secure_url;
        
        const { replyTo } = req.body;
        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            messageType,
            replyTo: replyTo || null,
            ...media,
        });
        const lastMessage = messageType === "image" ? "📷 Photo" : messageType === "video" ? "🎥 Video" : messageType === "audio" ? "🎵 Audio" : "📄 File";
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage,
            lastMessageAt: new Date(),
        });
        const conversation = await Conversation.findById(conversationId);
        const receiverId = conversation.members.find(
            (m) => m.toString() !== senderId
        );
        const existing = conversation.unreadCounts.find(
            (u) => u.user.toString() === receiverId.toString()
        );
        if (existing) existing.count++;
        else {
            conversation.unreadCounts.push({
                user: receiverId,
                count: 1,
            });
        }
        await conversation.save();
        await createNotification(senderId,receiverId,"new_message","Sent media");
        const populated = await Message.findById(message._id)
            .populate("sender", "name avatar email")
            .populate({
                path: "replyTo",
                populate: {
                    path: "sender",
                    select: "name avatar"
                }
            });
        getIo().to(conversationId).emit("new-message",populated);
        res.status(201).json({
            success: true,
            message: populated,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};