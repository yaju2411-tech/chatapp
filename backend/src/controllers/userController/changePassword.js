import { User } from "../../models/User.js";
import bcrypt from "bcryptjs";

export const changePassword = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success:false
            });
        }
        const hashPassword = await bcrypt.hash(password,10);
        user.password = hashPassword;
        user.otp = null;
        user.otpExpire = null;
        await user.save();

        res.status(200).json({
            success:true,
            message:"Password changed"
        });
    }catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        });
    }
}