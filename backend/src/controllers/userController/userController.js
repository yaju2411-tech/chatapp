import { User } from "../../models/User.js";

export const getProfile = async(req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-password -otp -otpExpire");
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        res.status(200).json({
            success:true,
            user
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}