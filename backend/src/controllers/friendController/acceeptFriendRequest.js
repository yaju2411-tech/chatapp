import { Friend } from "../../models/Friend.js"
import { friendEmmiter } from "../../emitter/friendEmitter.js";
import { createNotification } from "../../service/notificationService.js";
import { User } from "../../models/User.js";

export const acceptFriendRequest = async(req,res) => {
    try{
        const request = await Friend.findById(req.params.id);
        if(!request){
            return res.status(404).json({ 
                success:false, 
                message:"Request not found" 
            });
        }
        if(request.receiver.toString() !== req.user.id){ 
            return res.status(403).json({ 
                success:false, 
                message:"Unauthorized" 
            }); 
        }
        request.status = "accepted";
        await request.save();

        const receiver = await User.findById(req.user.id);
        const sender = await User.findById(request.sender);
        await createNotification(req.user.id,request.sender,"friend_accept",
            `${req.user.name} accepted your friend request`);
        friendEmmiter.emit("friend-accepted",receiver,sender);

        res.status(200).json({ 
            success:true, 
            message:"Friend request accepted" 
        });
    }
    catch(err){
        res.status(500).json({ 
            success:false, 
            message:err.message,
        });
    }
}