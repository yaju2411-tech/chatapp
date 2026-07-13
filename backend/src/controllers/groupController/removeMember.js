import { Conversation } from "../../models/Conversation.js";
import { User } from "../../models/User.js";

export const removeMember = async(req,res) => {
    try{
        const {memberId} = req.body;
        const conversation = req.conversation;
        const userId = req.user.id;
        //check member
        if(!memberId){
            return res.status(400).json({
                success: false,
                message: "Member not found."
            });
        }
        //check group
        if(!conversation.isGroup){
            return res.status(400).json({
                success: false,
                message: "Group not found"
            });
        }
        //check admin-permission 
        const isAdmin = conversation.admins.some(
            admin => admin.toString() === userId,
        );
        if(conversation.groupSettings.onlyAdminsCanRemoveMembers && !isAdmin){
            return res.status(403).json({
                success: false,
                message: "Only admins can remove members."
            });
        }
         // Creator cannot be removed
        if (conversation.createdBy.toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: "Group creator cannot be removed."
            });
        }
        // Check member exists in group
        const isMember = conversation.members.some(
            member => member.toString() === memberId
        );
        if (!isMember) {
            return res.status(404).json({
                success: false,
                message: "User is not a member of this group."
            });
        }
        const targetIsAdmin = conversation.admins.some(admin => admin.toString() === memberId);
        if ( targetIsAdmin && conversation.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only the group creator can remove another admin."
            });
        }
        //remove member
        conversation.members.pull(memberId);
        //remove admins if applicable
        conversation.admins.pull(memberId);
        //remove unreadCounts
        conversation.unreadCounts = conversation.unreadCounts.filter(
            unread => unread.user.toString() !== memberId
        );
        await conversation.save();
        const updatedConversation = await Conversation.findById(conversation._id)
            .populate("members", "name avatar isOnline lastSeen")
            .populate("createdBy", "name avatar")
            .populate("admins", "name avatar");
        return res.status(200).json({
            success: true,
            message: "Member removed successfully.",
            conversation: updatedConversation
        });
    }
    catch(err){
        console.error("Remove Member Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to remove member."
        });
    }
};