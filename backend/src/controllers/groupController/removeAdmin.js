import { Conversation } from "../../models/Conversation.js";

export const removeAdmin = async (req, res) => {
    try {
        const { memberId } = req.body;
        const conversation = req.conversation;
        const userId = req.user.id;
        if (!memberId) {
            return res.status(400).json({
                success: false,
                message: "Member ID is required."
            });
        }
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        // Creator can never lose admin role
        if (conversation.createdBy.toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: "Group creator cannot be removed as admin."
            });
        }
        const isAdmin = conversation.admins.some(
            admin => admin.toString() === memberId
        );
        if (!isAdmin) {
            return res.status(400).json({
                success: false,
                message: "User is not an admin."
            });
        }
        conversation.admins.pull(memberId);
        await conversation.save();
        const updatedConversation = await Conversation.findById(conversation._id)
            .populate("members", "name avatar isOnline lastSeen")
            .populate("admins", "name avatar")
            .populate("createdBy", "name avatar");
        return res.status(200).json({
            success: true,
            message: "Admin removed successfully.",
            conversation: updatedConversation
        });
    } catch (error) {
        console.error("Remove Admin Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove admin."
        });
    }
};