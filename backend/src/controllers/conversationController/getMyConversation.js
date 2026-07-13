import { Conversation } from "../../models/Conversation.js";

export const getMyConversations = async(req,res)=>{
    try{
        const conversations = await Conversation.find({
            members:req.user.id
        })
        .populate("members","name avatar email")
        .populate("admins","name avatar")
        .populate("createdBy","name avatar")
        .sort({ lastMessageAt:-1 });
        const result = conversations.map(conv => ({
            ...conv.toObject(),
            unreadCount:conv.unreadCounts.find(
                u => u.user.toString() === req.user.id
            )?.count || 0,
            displayName: conv.isGroup ? conv.groupName : conv.members.find(
                m => m._id.toString() !== req.user.id
            )?.name,
            displayAvatar: conv.isGroup ? conv.groupAvatar : conv.members.find(
                m => m._id.toString() !== req.user.id
            )?.avatar
        }));
        res.status(200).json({
            success:true,
            conversations:result
        });
    }catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}