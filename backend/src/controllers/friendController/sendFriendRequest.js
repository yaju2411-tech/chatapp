import { User } from "../../models/User.js";
import { Friend } from "../../models/Friend.js";
import { friendEmmiter } from "../../emitter/friendEmitter.js";
import { createNotification } from "../../service/notificationService.js";

//for sending friend request
export const sendFriendRequest = async(req,res) => {
    try{
        const senderId = req.user.id;
        const receiveId = req.params.id;
        if(senderId === receiveId){
            return res.status(400).json({
                success:false,
                message:"Cant send request to your self"
            });
        }
        const receiver = await User.findById(receiveId);
        if(!receiver){
            return res.status(404).json({
                success:false,
                message:"User not Found"
            });
        }
        const existingRequest = await Friend.findOne({
            $or:[
                {
                    sender:senderId,
                    receiver:receiveId
                },
                {
                    sender:receiveId,
                    receiver:senderId
                }
            ]
        });
        if (existingRequest){ 
            return res.status(400).json({ 
                success: false, 
                message: "Request already exists" 
            }); 
        }
        const friendRequest = await Friend.create({
            sender: senderId,
            receiver: receiveId,
            status: "pending",
        });
        const sender = await User.findById(senderId);
        await createNotification(sender._id,receiver._id,"friend_request",
            `${sender.name} sent you a friend request`);
        friendEmmiter.emit("friend-request",sender,receiver);
        res.status(201).json({
            success: true, 
            message: "Friend request sent", 
            friendRequest
        });
    }
    catch(err){
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
}