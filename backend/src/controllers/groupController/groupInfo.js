import { Conversation } from "../../models/Conversation.js";

export const getGroupInfo = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.conversation._id)
            .populate("members", "name avatar isOnline lastSeen")
            .populate("admins", "name avatar isOnline lastSeen")
            .populate("createdBy", "name avatar isOnline lastSeen");
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        return res.status(200).json({
            success: true,
            group: {
                _id: conversation._id,
                groupName: conversation.groupName,
                groupAvatar: conversation.groupAvatar,
                description: conversation.description,
                createdBy: conversation.createdBy,
                admins: conversation.admins,
                members: conversation.members,
                groupSettings: conversation.groupSettings,
                inviteLink: conversation.inviteLink,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }
        });
    } catch (error) {
        console.error("Get Group Info Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get group information."
        });
    }
};