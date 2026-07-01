import { User } from "../../models/User.js";
import { transporter } from "../../config/nodemailer.js";


export const forgotPasswordController = async(req,res) => {
    try{
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        const otp = Math.floor(100000 + Math.random()*90000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 5*60*1000;
        
        await user.save();
        await transporter.sendMail({
            from:process.env.EMAIL_USER,
            to:email,
            subject:"Password Reset OTP",
            html:`<h1>${otp}</h1>`
        });
        res.status(200).json({
            success:true,
            message:"OTP sent"
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
};