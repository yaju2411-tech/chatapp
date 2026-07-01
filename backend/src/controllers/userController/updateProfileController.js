import { User } from "../../models/User.js"

export const updateProfile = async(req,res) => {
    try{
        const {name,avatar} = req.body;
        const user = await User.findById(req.user.id);
        if(!user){
             return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        user.name = name || user.name;
        user.avatar = avatar || user.avatar;
        await user.save();
        
        return res.status(201).json({
            success: true,
            user
        });
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}