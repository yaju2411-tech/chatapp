import { Conversation } from "../../models/Conversation.js";

export const updateGroupSettings = async (req, res) => {
    try {
        const conversation = req.conversation;
        const {onlyAdminsCanEditInfo,onlyAdminsCanAddMembers,
        onlyAdminsCanRemoveMembers,onlyAdminsCanSendMessages} = req.body;
        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group."
            });
        }
        const hasSettings = typeof onlyAdminsCanEditInfo === "boolean" || typeof onlyAdminsCanAddMembers === "boolean" ||
            typeof onlyAdminsCanRemoveMembers === "boolean" || typeof onlyAdminsCanSendMessages === "boolean";
        if (!hasSettings) {
            return res.status(400).json({
                success: false,
                message: "No valid group settings provided."
            });
        }
        // Update only the provided settings
        if (typeof onlyAdminsCanEditInfo === "boolean") {
            conversation.groupSettings.onlyAdminsCanEditInfo = onlyAdminsCanEditInfo;
        }
        if (typeof onlyAdminsCanAddMembers === "boolean") {
            conversation.groupSettings.onlyAdminsCanAddMembers = onlyAdminsCanAddMembers;
        }
        if (typeof onlyAdminsCanRemoveMembers === "boolean") {
            conversation.groupSettings.onlyAdminsCanRemoveMembers = onlyAdminsCanRemoveMembers;
        }
        if (typeof onlyAdminsCanSendMessages === "boolean") {
            conversation.groupSettings.onlyAdminsCanSendMessages = onlyAdminsCanSendMessages;
        }
        await conversation.save();
        return res.status(200).json({
            success: true,
            message: "Group settings updated successfully.",
            groupSettings: conversation.groupSettings
        });
    } catch (error) {
        console.error("Update Group Settings Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update group settings."
        });
    }
};