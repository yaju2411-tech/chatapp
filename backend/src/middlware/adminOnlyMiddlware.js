import { Conversation } from "../../src/models/Conversation.js";
import { User } from "../../src/models/User.js";

export const adminOnlyMiddleware = (req, res, next) => {
    const conversation = req.conversation;
    const userId = req.user.id;
    const isAdmin = conversation.admins.some(
        admin => admin.toString() === userId
    );
    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: "Only group admins can perform this action."
        });
    }
    next();
};