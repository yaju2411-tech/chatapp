import { User } from "../models/User.js";

export const roleMiddleware = (...roles) => {
    return async(req,res,next)=>{
        try{
            const user = await User.findById(req.user.id);
            if(!user){
                return res.status(404).json({
                    success:false,
                    message:"User not found"
                });
            }
            if(!roles.includes(user.role)){
                return res.status(403).json({
                    success:false,
                    message:"Access denied"
                });
            }
            next();
        }catch(err){
            return res.status(500).json({
                success:false,
                message:err.message
            });
        }
    }
}