import { Message } from "../../models/Message.js";
import { getIo } from "../../socket/socketServer.js";

export const clearGroupChat = async (req, res) => {
    try {
        const conversation = req.conversation;
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        await Message.deleteMany({
            conversation: conversation._id
        });
        conversation.lastMessage = "";
        conversation.lastMessageAt = new Date();
        conversation.unreadCounts.forEach(unread => {
            unread.count = 0;
        });
        await conversation.save();
        getIo().to(conversation._id.toString()).emit("group-chat-cleared", {
            conversationId: conversation._id
        });
        return res.status(200).json({
            success: true,
            message: "Group chat cleared successfully."
        });
    } catch (err) {
        console.error("Clear Group Chat Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to clear group chat."
        });
    }
};