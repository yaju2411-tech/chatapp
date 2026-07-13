import mongoose from "mongoose";
import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { createNotification } from "../../service/notificationService.js";
import { getIo } from "../../socket/socketServer.js";

export const forwardMessages = async (req, res) => {
    try {
        const { conversationIds, messageIds } = req.body;
        if (!conversationIds?.length || !messageIds?.length) {
            return res.status(400).json({
                success: false,
                message: "ConversationIds and MessageIds are required"
            });
        }
        // Validate IDs
        for (const cid of conversationIds) {
            if (!mongoose.Types.ObjectId.isValid(cid)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid conversation ID: ${cid}`
                });
            }
        }
        for (const mid of messageIds) {
            if (!mongoose.Types.ObjectId.isValid(mid)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid message ID: ${mid}`
                });
            }
        }
        // Fetch original messages
        const originalMessages = await Message.find({
            _id: { $in: messageIds }
        }).sort({ createdAt: 1 });
        if (!originalMessages.length) {
            return res.status(404).json({
                success: false,
                message: "No valid messages found."
            });
        }
        const forwardedMessages = [];
        for (const conversationId of conversationIds) {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: `Conversation not found: ${conversationId}`
                });
            }
            // User must belong to conversation
            const isMember = conversation.members.some(
                member => member.toString() === req.user.id
            );
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied."
                });
            }
            // Group permission check BEFORE forwarding
            if (conversation.isGroup) {
                const isAdmin = conversation.admins.some(
                    admin => admin.toString() === req.user.id
                );
                if (
                    conversation.groupSettings.onlyAdminsCanSendMessages &&
                    !isAdmin
                ) {
                    return res.status(403).json({
                        success: false,
                        message: "Only admins can send messages."
                    });
                }
            }
            let lastMessage = "";
            for (const msg of originalMessages) {
                const newMessage = await Message.create({
                    conversation: conversationId,
                    sender: req.user.id,
                    text: msg.text,
                    image: msg.image,
                    video: msg.video,
                    audio: msg.audio,
                    file: msg.file,
                    gifUrl: msg.gifUrl,
                    messageType: msg.messageType,
                    replyTo: null,
                    forwarded: true,
                    seenBy: [req.user.id]
                });
                forwardedMessages.push(newMessage);
                switch (msg.messageType) {
                    case "text":
                        lastMessage = msg.text;
                        break;
                    case "image":
                        lastMessage = "📷 Photo";
                        break;
                    case "video":
                        lastMessage = "🎥 Video";
                        break;
                    case "audio":
                        lastMessage = "🎵 Audio";
                        break;
                    case "gif":
                        lastMessage = "😂 GIF";
                        break;
                    case "file":
                        lastMessage = "📄 Document";
                        break;
                    default:
                        lastMessage = "Message";
                }
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate("sender", "name avatar email")
                    .populate({path: "replyTo",select: "text sender messageType image video audio gifUrl file"})
                    .populate("seenBy", "name avatar");
                getIo().to(conversationId).emit("new-message", populatedMessage);
            }
            // Update unread counts ONCE
            if (conversation.isGroup) {
                conversation.unreadCounts.forEach(unread => {
                    if (unread.user.toString() !== req.user.id) {
                        unread.count += originalMessages.length;
                    }
                });
            } else {
                const receiverId = conversation.members.find(
                    member => member.toString() !== req.user.id
                );
                const existing = conversation.unreadCounts.find(
                    unread => unread.user.toString() === receiverId.toString()
                );
                if (existing) {
                    existing.count += originalMessages.length;
                } else {
                    conversation.unreadCounts.push({
                        user: receiverId,
                        count: originalMessages.length
                    });
                }
            }
            conversation.lastMessage = lastMessage;
            conversation.lastMessageAt = new Date();
            await conversation.save();
            // Notifications
            if (conversation.isGroup) {
                for (const member of conversation.members) {
                    if (member.toString() === req.user.id) continue;
                    await createNotification(req.user.id,member,"new_message","Forwarded a message");
                }
            } else {
                const receiverId = conversation.members.find(
                    member => member.toString() !== req.user.id
                );
                await createNotification(req.user.id,receiverId,"new_message","Forwarded a message");
            }
        }
        return res.status(201).json({
            success: true,
            message: "Messages forwarded successfully.",
            forwardedMessages
        });
    } catch (err) {
        console.error("Forward Message Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};