import { Message } from "../../models/Message.js";
import { Conversation } from "../../models/Conversation.js";
import { createNotification } from "../../service/notificationService.js";
import { getIo } from "../../socket/socketServer.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const {conversationId,text,image,video,
            audio,file,messageType,replyTo,gifUrl} = req.body;
        // Get conversation
        const conversation = req.conversation;
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found."
            });
        }
        // ===============================
        // Group Permission Check
        // ===============================
        if (conversation.isGroup) {
            const isAdmin = conversation.admins.some(
                admin => admin.toString() === senderId
            );
            if ( conversation.groupSettings.onlyAdminsCanSendMessages && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Only admins can send messages."
                });
            }
        }
        // ===============================
        // Create Message
        // ===============================
        const message = await Message.create({conversation: conversationId,sender: senderId,
            text,image,video,audio,file,messageType,replyTo,gifUrl});
        // ===============================
        // Update Conversation
        // ===============================
        const lastMessage = messageType === "gif" ? "GIF" : messageType === "image" 
                ? "Photo" : messageType === "video" ? "Video" : messageType === "audio" 
                ? "Audio" : messageType === "file" ? "File" : text;
        conversation.lastMessage = lastMessage;
        conversation.lastMessageAt = new Date();
        // ===============================
        // Update Unread Counts
        // ===============================
        if (conversation.isGroup) {
            conversation.unreadCounts.forEach(unread => {
                if (unread.user.toString() !== senderId) {
                    unread.count += 1;
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
                existing.count += 1;
            } else {
                conversation.unreadCounts.push({
                    user: receiverId,
                    count: 1
                });
            }
        }
        await conversation.save();
        // ===============================
        // Notifications
        // ===============================
        if (conversation.isGroup) {
            for (const member of conversation.members) {
                if (member.toString() === senderId) continue;
                await createNotification(
                    senderId,member,"new_message",
                    "Sent a message in the group."
                );
            }
        } else {
            const receiverId = conversation.members.find(
                member => member.toString() !== senderId
            );
            await createNotification(
                senderId,
                receiverId,
                "new_message",
                "Sent you a message"
            );

        }
        // ===============================
        // Populate Message
        // ===============================
        const populatedMessage = await Message.findById(message._id)
            .populate(
                "sender",
                "name avatar email"
            )
            .populate({
                path: "replyTo",
                populate: {
                    path: "sender",
                    select: "name avatar"
                }
            });
        // ===============================
        // Socket Emit
        // ===============================
        getIo().to(conversationId).emit(
            "new-message",
            populatedMessage
        );
        return res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (err) {
        console.error("Send Message Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};