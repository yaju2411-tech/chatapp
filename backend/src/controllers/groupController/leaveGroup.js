import { Conversation } from "../../models/Conversation.js";

export const leaveGroup = async (req, res) => {
    try {
        const conversation = req.conversation;
        const userId = req.user.id;
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        // Creator cannot leave
        if (conversation.createdBy.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: "Transfer group ownership before leaving."
            });
        }
        conversation.members.pull(userId);
        conversation.admins.pull(userId);
        conversation.unreadCounts = conversation.unreadCounts.filter(
            unread => unread.user.toString() !== userId
        );
        await conversation.save();
        return res.status(200).json({
            success: true,
            message: "You left the group successfully."
        });
    } catch (error) {
        console.error("Leave Group Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to leave group."
        });
    }
};