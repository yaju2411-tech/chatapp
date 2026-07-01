import { Conversation } from "../../models/Conversation.js";

export const getMyConversations = async(req,res)=>{
    try{
        const conversations = await Conversation.find({
            members:req.user.id
        })
        .populate(
            "members",
            "name avatar email"
        )
        .sort({
            lastMessageAt:-1
        });
        const result = conversations.map(conv => ({
            ...conv.toObject(),
            unreadCount:conv.unreadCounts.find(u => u.user.toString() === req.user.id)?.count || 0
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