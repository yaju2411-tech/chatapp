import { Conversation } from "../../models/Conversation.js";

export const getSingleConversation = async(req,res)=>{
    try{
        const conversation = await Conversation.findById(
            req.params.id
        ).populate(
            "members",
            "name avatar email isOnline lastSeen"
        ).populate(
            "admins",
            "name avatar isOnline lastSeen"
        )
        .populate(
            "createdBy",
            "name avatar isOnline lastSeen"
        );
        if(!conversation){
            return res.status(404).json({
                success:false,
                message:"Conversation not found"
            });
        }
        const unread = conversation.unreadCounts.find(
            u => u.user.toString() === req.user.id
        )?.count || 0;
        res.status(200).json({
            success:true,
            conversation,unreadCount:unread
        });
    }catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}