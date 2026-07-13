import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";

export const deleteGroup = async (req, res) => {
    try {
        const conversation = req.conversation;
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        // Delete all messages in the group
        await Message.deleteMany({
            conversation: conversation._id
        });
        // Delete the conversation
        await Conversation.findByIdAndDelete(conversation._id);
        return res.status(200).json({
            success: true,
            message: "Group deleted successfully."
        });
    } catch (error) {
        console.error("Delete Group Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete group."
        });
    }
};