import { Conversation } from "../../models/Conversation.js";
import { User } from "../../models/User.js";

export const transferOwnership = async (req, res) => {
    try {
        const { memberId } = req.body;
        const conversation = req.conversation;
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
        // User exists?
        const user = await User.findById(memberId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }
        // Must already be a member
        const isMember = conversation.members.some(
            member => member.toString() === memberId
        );
        if (!isMember) {
            return res.status(400).json({
                success: false,
                message: "User is not a member of this group."
            });
        }
        // Already creator?
        if (conversation.createdBy.toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: "User is already the group creator."
            });
        }
        // New owner should always be an admin
        const isAdmin = conversation.admins.some(
            admin => admin.toString() === memberId
        );
        if (!isAdmin) {
            conversation.admins.push(memberId);
        }
        // Transfer ownership
        conversation.createdBy = memberId;
        await conversation.save();
        const updatedConversation = await Conversation.findById(conversation._id)
            .populate("members", "name avatar isOnline lastSeen")
            .populate("admins", "name avatar")
            .populate("createdBy", "name avatar");
        return res.status(200).json({
            success: true,
            message: "Group ownership transferred successfully.",
            conversation: updatedConversation
        });
    } catch (error) {
        console.error("Transfer Ownership Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to transfer ownership."
        });
    }
};