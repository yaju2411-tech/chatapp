import crypto from "crypto";
import { Conversation } from "../../models/Conversation.js";

export const generateInviteLink = async (req, res) => {
  try {
    const conversation = req.conversation;
    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: "This is not a group.",
      });
    }

    // Generate a unique 16-character hex string as the invite code
    const inviteCode = crypto.randomBytes(8).toString("hex");
    conversation.inviteLink = inviteCode;
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Invite link generated successfully.",
      inviteLink: conversation.inviteLink,
    });
  } catch (error) {
    console.error("Generate Invite Link Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invite link.",
    });
  }
};
