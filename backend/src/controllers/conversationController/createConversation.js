import { Conversation } from "../../models/Conversation.js";
import { User } from "../../models/User.js";
import { createNotification } from "../../service/notificationService.js";

export const createConversation = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;
        let conversation = await Conversation.findOne({
            members: {
                $all: [senderId, receiverId]
            },
            isGroup: false
        });
        if (!conversation) {
            conversation = await Conversation.create({
                members: [senderId, receiverId],
                createdBy: senderId
            });
            // Create notification only when new conversation is created
            const sender = await User.findById(senderId);
        }
        res.status(200).json({
            success: true,
            conversation
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};