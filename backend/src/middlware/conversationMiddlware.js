import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";

export const ConversationMiddlware = async (req, res, next) => {
    try {

        const conversationId = req.params.conversationId || req.params.id || req.body.conversationId;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "invalid conversation id"
            });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isMember = conversation.members.some(
            member => member.toString() === req.user.id
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        req.conversation = conversation;
        next();
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};