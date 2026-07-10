import { User } from "../../models/User.js";

export const searchUser = async (req, res) => {
    try {
        const queryStr = req.query.email;
        if (!queryStr) {
            return res.status(200).json({
                success: true,
                user: null
            });
        }

        const user = await User.findOne({
            _id: { $ne: req.user.id },
            $or: [
                { email: { $regex: queryStr, $options: "i" } },
                { name: { $regex: queryStr, $options: "i" } }
            ]
        }).select("-password");

        res.status(200).json({
            success: true,  
            user: user || null
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};