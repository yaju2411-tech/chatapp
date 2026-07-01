import { Message } from "../../models/Message.js";
import { Conversation } from "../../models/Conversation.js";
import { getIo } from "../../socket/socketServer.js";

export const clearChat = async (req, res) => {
    try {
        const conversationId = req.params.id;
        await Message.deleteMany({
            conversation: conversationId
        });
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: "",
            lastMessageAt: new Date(),
            unreadCounts: []
        });
        getIo().to(conversationId).emit("chat-cleared", conversationId);
        res.status(200).json({
            success: true,
            message: "Chat cleared successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};