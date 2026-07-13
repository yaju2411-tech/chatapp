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
                folder,
                resource_type,
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
        // Find conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found.",
            });
        }
        // Verify membership
        const isMember = conversation.members.some(
            member => member.toString() === senderId
        );
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }
        // Group permission
        if (conversation.isGroup) {
            const isAdmin = conversation.admins.some(
                admin => admin.toString() === senderId
            );
            if (conversation.groupSettings.onlyAdminsCanSendMessages && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Only admins can send media.",
                });
            }
        }
        let resource_type = "raw";
        let messageType = "file";
        if (req.file.mimetype.startsWith("image/")) {
            resource_type = "image";
            messageType = "image";
        } else if (req.file.mimetype.startsWith("video/")) {
            resource_type = "video";
            messageType = "video";
        } else if (req.file.mimetype.startsWith("audio/")) {
            resource_type = "video";
            messageType = "audio";
        }
        const upload = await uploadBuffer(req.file.buffer,"chat-app",resource_type);
        const media = {
            image: "",
            video: "",
            audio: "",
            file: "",
        };
        media[messageType] = upload.secure_url;
        const { replyTo } = req.body;
        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            messageType,
            replyTo: replyTo || null,
            seenBy: [senderId],
            ...media,
        });
        let lastMessage = "📄 File";
        switch (messageType) {
            case "image":
                lastMessage = "📷 Photo";
                break;
            case "video":
                lastMessage = "🎥 Video";
                break;
            case "audio":
                lastMessage = "🎵 Audio";
                break;
            case "file":
                lastMessage = "📄 File";
                break;
        }
        conversation.lastMessage = lastMessage;
        conversation.lastMessageAt = new Date();
        // Update unread counts
        if (conversation.isGroup) {
            conversation.unreadCounts.forEach(unread => {
                if (unread.user.toString() !== senderId) {
                    unread.count++;
                }
            });
        } else {
            const receiverId = conversation.members.find(
                member => member.toString() !== senderId
            );
            const existing = conversation.unreadCounts.find(
                unread => unread.user.toString() === receiverId.toString()
            );
            if (existing) {
                existing.count++;
            } else {
                conversation.unreadCounts.push({
                    user: receiverId,
                    count: 1,
                });
            }
        }
        await conversation.save();
        // Notifications
        if (conversation.isGroup) {
            for (const member of conversation.members) {
                if (member.toString() === senderId) continue;
                await createNotification(senderId,member,"new_message","Sent media");
            }
        } else {
            const receiverId = conversation.members.find(
                member => member.toString() !== senderId
            );
            await createNotification(senderId,receiverId,"new_message","Sent media");
        }
        const populated = await Message.findById(message._id)
            .populate("sender", "name avatar email")
            .populate({
                path: "replyTo",
                populate: {
                    path: "sender",
                    select: "name avatar",
                },
            })
            .populate("seenBy", "name avatar");
        getIo().to(conversationId).emit("new-message", populated);
        return res.status(201).json({
            success: true,
            message: populated,
        });
    } catch (err) {
        console.error("Upload Media Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};