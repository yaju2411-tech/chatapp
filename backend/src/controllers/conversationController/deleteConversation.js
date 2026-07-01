import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { getIo } from "../../socket/socketServer.js";

export const deleteConversation = async(req,res) => {
    try{
        const conversationId = req.params.id;
        const conversation = await Conversation.findById(conversationId);
        if(!conversation){
            return res.status(401).json({
                success:false,
                message:"Conversation not found",
            })
        }
        //message delete
        await Message.deleteMany({
            conversation:conversationId,
        });
        //conversation delete
        await Conversation.findByIdAndDelete(conversationId);
        res.status(200).json({
            success:true,
            message:"Delete Conversatio successfully"
        });
        getIo().to(conversationId).emit("conversation-deleted", {conversationId});
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        });
    }
};