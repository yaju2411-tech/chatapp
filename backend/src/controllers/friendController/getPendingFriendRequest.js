import { Friend } from "../../models/Friend.js";

export const getPendingFriendRequests = async(req,res)=>{
    try{
        const requests = await Friend.find({
            receiver:req.user.id,
            status:"pending"
        }).populate("sender","name email avatar");
        res.status(200).json({
            success:true,
            requests
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}
