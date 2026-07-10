import mongoose from "mongoose";
import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { createNotification } from "../../service/notificationService.js";
import { getIo } from "../../socket/socketServer.js";

export const forwardMessages = async (req, res) => {
    try {
        const { conversationIds, messageIds } = req.body;
        if(!conversationIds?.length || !messageIds?.length){
            return res.status(400).json({
                success: false,
                message: "ConversationIds and MessageIds are required"
            });
        }

        // Validate formats
        for (const cid of conversationIds) {
            if (!mongoose.Types.ObjectId.isValid(cid)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid conversation ID format: ${cid}`
                });
            }
        }
        for (const mid of messageIds) {
            if (!mongoose.Types.ObjectId.isValid(mid)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid message ID format: ${mid}`
                });
            }
        }

        // Fetch original messages
        const originalMessages = await Message.find({
            _id: { $in: messageIds }
        }).sort({ createdAt: 1 });

        if (originalMessages.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid messages found to forward"
            });
        }

        const forwardedMessages = [];
        for (const conversationId of conversationIds) {
            // Check conversation exists
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: `Conversation not found: ${conversationId}`
                });
            }

            // Verify membership
            const isMember = conversation.members.some(
                member => member.toString() === req.user.id
            );
            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied for conversation: ${conversationId}`
                });
            }

            const receiverId = conversation.members.find(
                member => member.toString() !== req.user.id
            );

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
                    seenBy: [req.user.id],
                    forwarded: true,
                });
                forwardedMessages.push(newMessage);

                // Update Conversation Last Message
                let lastMessage = "";
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

                // Increment unread count for receiver if it exists
                if (receiverId) {
                    const existing = conversation.unreadCounts.find(
                        u => u.user.toString() === receiverId.toString()
                    );
                    if (existing) {
                        existing.count++;
                    } else {
                        conversation.unreadCounts.push({
                            user: receiverId,
                            count: 1,
                        });
                    }
                    await createNotification(req.user.id, receiverId, "new_message", "Forwarded a message");
                }

                conversation.lastMessage = lastMessage;
                conversation.lastMessageAt = new Date();
                await conversation.save();

                // Fire socket to get instant result
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate("sender", "name avatar email")
                    .populate({
                        path: "replyTo",
                        select: "text sender messageType image video audio gifUrl file"
                    }).populate("seenBy", "name avatar");
                getIo().to(conversationId).emit("new-message", populatedMessage);                
            }
        }
        return res.status(201).json({
            success: true,
            message: "Messages forwarded successfully",
            forwardedMessages
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};