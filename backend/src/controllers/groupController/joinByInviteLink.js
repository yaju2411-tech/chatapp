import { Conversation } from "../../models/Conversation.js";

export const joinByInviteLink = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required.",
      });
    }

    // Find the group with the given invite code
    const conversation = await Conversation.findOne({
      inviteLink: inviteCode,
      isGroup: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found or invite link is invalid.",
      });
    }

    // Check if the user is already a member
    const alreadyMember = conversation.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (alreadyMember) {
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate("members", "name avatar isOnline lastSeen")
        .populate("createdBy", "name avatar")
        .populate("admins", "name avatar");

      return res.status(200).json({
        success: true,
        message: "You are already a member of this group.",
        conversation: populatedConversation,
      });
    }

    // Add member
    conversation.members.push(userId);
    conversation.unreadCounts.push({
      user: userId,
      count: 0,
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("members", "name avatar isOnline lastSeen")
      .populate("createdBy", "name avatar")
      .populate("admins", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Successfully joined the group.",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("Join Group By Link Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join group by link.",
    });
  }
};
