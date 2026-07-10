import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

export const ConversationMiddlware = async (req, res, next) => {
    try {
        let conversationId = req.params.conversationId || req.body?.conversationId || req.query?.conversationId;

        // If not found, look at generic id
        const genericId = req.params.id || req.body?.id || req.query?.id;
        
        let messageId = req.params.messageId || req.body?.messageId || req.query?.messageId;

        // Support messageIds array (from req.body.messageIds)
        const messageIds = req.body?.messageIds;

        // If we have messageIds array, we can use the first one to find the conversation
        if (!messageId && Array.isArray(messageIds) && messageIds.length > 0) {
            messageId = messageIds[0];
        }

        let finalConversationId = null;

        if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
            finalConversationId = conversationId;
        } else if (genericId && mongoose.Types.ObjectId.isValid(genericId)) {
            // Check if genericId is a Conversation
            const conversationExists = await Conversation.exists({ _id: genericId });
            if (conversationExists) {
                finalConversationId = genericId;
            } else {
                // Check if genericId is a Message
                const message = await Message.findById(genericId);
                if (message) {
                    finalConversationId = message.conversation;
                }
            }
        } else if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
            const message = await Message.findById(messageId);
            if (message) {
                finalConversationId = message.conversation;
            }
        }

        // Support conversationIds array (e.g. forwardMessages)
        const conversationIds = req.body?.conversationIds;
        if (!finalConversationId && Array.isArray(conversationIds) && conversationIds.length > 0) {
            // Verify membership for ALL conversationIds in the array
            for (const cid of conversationIds) {
                if (!mongoose.Types.ObjectId.isValid(cid)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid conversation ID format: ${cid}`
                    });
                }
                const conversation = await Conversation.findById(cid);
                if (!conversation) {
                    return res.status(404).json({
                        success: false,
                        message: `Conversation not found: ${cid}`
                    });
                }
                const isMember = conversation.members.some(
                    member => member.toString() === req.user.id
                );
                if (!isMember) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied for conversation: ${cid}`
                    });
                }
            }
            // If all are valid and user has access, continue
            return next();
        }

        if (!finalConversationId) {
            return res.status(400).json({
                success: false,
                message: "No valid conversation ID or message ID provided"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(finalConversationId)) {
            return res.status(400).json({
                success: false,
                message: "invalid conversation id"
            });
        }

        const conversation = await Conversation.findById(finalConversationId);
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
        console.error("ConversationMiddlware Error Stack:", err.stack);
        console.log("ConversationMiddlware req.user:", req.user);
        console.log("ConversationMiddlware req.params:", req.params);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};