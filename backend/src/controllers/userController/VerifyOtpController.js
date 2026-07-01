import { User } from "../../models/User.js";

export const VerifyOtp = async(req,res) => {
    try{
        const {email,otp} = req.body;
        const user = await User.findOne({email});
        if(!user){
             return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        if(user.otp !== otp){
             return res.status(404).json({
                success:false,
                message:"Invalid Otp"
            });
        }
        if(!user.otpExpire || user.otpExpire < Date.now()){
             return res.status(404).json({
                success:false,
                message:"Otp is expire"
            });
        }
        user.isVerified = true;
        user.otp = null;
        user.otpExpire = null;
        await user.save();
        res.status(200).json({
            success:true,
            message:"Email verified"
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}