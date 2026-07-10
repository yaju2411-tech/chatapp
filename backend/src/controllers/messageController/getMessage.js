import { Message } from "../../models/Message.js";
import { Conversation } from "../../models/Conversation.js"

export const getMessage = async(req,res) => {
    try{
        const messages = await Message.find({
            conversation:req.params.conversationId
        }).populate({
            path: "replyTo",
            select: "text sender messageType image video audio gifUrl file",
            populate: {
                path: "sender",
                select: "name avatar",
            },
        }).populate(
            "seenBy",
            "name avatar"
        ).sort({createdAt:1})
        res.status(200).json({
            success:true,
            messages
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
};