export const creatorOnlyMiddleware = (req, res, next) => {
    const conversation = req.conversation;
    const userId = req.user.id;
    if (conversation.createdBy.toString() !== userId) {
        return res.status(403).json({
            success: false,
            message: "Only the group creator can perform this action."
        });
    }
    next();
};