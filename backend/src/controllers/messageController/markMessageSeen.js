import { Message } from "../../models/Message.js";
import { Conversation } from "../../models/Conversation.js";
import { createNotification } from "../../service/notificationService.js";
import { getIo } from "../../socket/socketServer.js";
import { onlineUsers } from "../../socket/socket.js";

export const markMessageSeen = async (req,res) => {
  try{
      await Message.updateMany(
        {
            conversation: req.params.conversationId,
            sender: { $ne: req.user.id },
            seenBy: { $ne: req.user.id }
        },
        {
            $addToSet: {
                seenBy: req.user.id
            },
            $push: {
                lastSeenBy: {
                    user: req.user.id,
                    seenAt: new Date()
                }
            }
        }
    );
    await Conversation.updateOne({
      _id:req.params.conversationId,
      "unreadCounts.user":req.user.id
    },
    {
        $set:{"unreadCounts.$.count":0}
    });
    getIo().to(req.params.conversationId).emit("messages-seen",{conversationId:req.params.conversationId});
      res.status(200).json({
      success:true
    });
  }
  catch(err){
    res.status(500).json({
      success:false,
      message:err.message
    });
  }
};
