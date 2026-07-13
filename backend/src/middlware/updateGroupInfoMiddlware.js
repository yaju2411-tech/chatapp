export const updateGroupInfoPermissionMiddleware = (req, res, next) => {
    const conversation = req.conversation;
    const userId = req.user.id;
    const isAdmin = conversation.admins.some(
        admin => admin.toString() === userId
    );
    if (conversation.groupSettings.onlyAdminsCanEditInfo && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: "Only admins can edit group information."
        });
    }
    next();
};