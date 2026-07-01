import { Friend } from "../models/Friend.js";

export const friendMiddlware = async(req,res,next) => {
    try{
        const currentUser = req.user.id;
        const friendId = req.params.id;
        
        const friendship = await Friend.findOne({
            status:"accepted",
            $or:[{
                    sender:currentUser,
                    receiver:friendId,
                },{
                    sender:friendId,
                    receiver:currentUser,
                }
            ]
        });
        if(!friendship){ 
            return res.status(403).json({ 
                success:false, 
                message:"Users are not friends" 
            }); 
        }
        next();
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}