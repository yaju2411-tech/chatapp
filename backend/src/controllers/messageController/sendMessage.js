import { Message } from "../../models/Message.js";
import { Conversation } from "../../models/Conversation.js";
import { createNotification } from "../../service/notificationService.js";
import { onlineUsers } from "../../socket/socket.js";
import { getIo } from "../../socket/socketServer.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { conversationId,text,image,video,audio,file,messageType,replyTo,gifUrl} = req.body;
        // create message
        const message = await Message.create({
            conversation: conversationId,
            sender: senderId,
            text,image,audio,video,file,messageType,replyTo,gifUrl
        });
        // update conversation
        const lastMessage = messageType === "gif" ? "GIF" : messageType === "image" ? "Photo"
            : messageType === "video" ? "Video" : messageType === "audio" ? "Audio" : messageType === "file" ? "File" : text;
        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                lastMessage,
                lastMessageAt: new Date(),
            }
        );
        // find receiver
        const conversation = await Conversation.findById(conversationId);
        const receiverId = conversation.members.find(
            member => member.toString() !== senderId
        );
        //for count no of message
        const conv = await Conversation.findById(conversationId);
        const existing = conv.unreadCounts.find(
            u => u.user.toString() === receiverId.toString()
        );
        if(existing){
            existing.count += 1;
        }
        else{
            conv.unreadCounts.push({
                user:receiverId,
                count:1
            });
        }
        await conv.save();
        // create notification
        await createNotification(senderId,receiverId,"new_message","Sent you a message");
        // populate message
        const populatedMessage = await Message.findById(message._id)
        .populate(
            "sender",
            "name avatar email"
        )
        .populate({
            path: "replyTo",
            populate: {
                path: "sender",
                select: "name avatar"
            }
        });
        // socket emit
        getIo().to(conversationId).emit("new-message", populatedMessage);
        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
