import { User } from "../../models/User.js";
import { transporter } from "../../config/nodemailer.js";

export const verifyResetOtp = async(req,res)=>{
    try{
        const {email,otp} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success:false
            });
        }
        if(user.otp !== otp){
            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            });
        }
        if(user.otpExpire < Date.now()){
            return res.status(400).json({
                success:false,
                message:"OTP expired"
            });
        }
        res.status(200).json({
            success:true
        });
    }catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}