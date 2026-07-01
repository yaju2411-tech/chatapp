import { User } from "../../models/User.js";

export const searchUser = async (req, res) => {
    try {
        const email = req.query.email;
        const user = await User.findOne({email}).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,  
            user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};