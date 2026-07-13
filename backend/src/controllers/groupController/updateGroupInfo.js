import { Conversation } from "../../models/Conversation.js";

export const updateGroupInfo = async (req, res) => {
    try {
        const conversation = req.conversation;
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        const {groupName,groupAvatar,description} = req.body;
        // At least one field must be provided
        const hasUpdate = typeof groupName === "string" || typeof groupAvatar === "string" || typeof description === "string";
        if (!hasUpdate) {
            return res.status(400).json({
                success: false,
                message: "No group information provided."
            });
        }
        // Update only provided fields
        if (typeof groupName === "string") {
            const trimmedName = groupName.trim();
            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Group name cannot be empty."
                });
            }
            conversation.groupName = trimmedName;
        }
        if (typeof groupAvatar === "string") {
            conversation.groupAvatar = groupAvatar.trim();
        }
        if (typeof description === "string") {
            conversation.description = description.trim();
        }
        await conversation.save();
        const updatedConversation = await Conversation.findById(conversation._id)
            .populate("members", "name avatar isOnline lastSeen")
            .populate("admins", "name avatar isOnline lastSeen")
            .populate("createdBy", "name avatar isOnline lastSeen");
        return res.status(200).json({
            success: true,
            message: "Group information updated successfully.",
            conversation: updatedConversation
        });
    } catch (error) {
        console.error("Update Group Info Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update group information."
        });
    }
};