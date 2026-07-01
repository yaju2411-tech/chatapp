import { Friend } from "../../models/Friend.js";
import { User } from "../../models/User.js";
import { friendEmmiter } from "../../emitter/friendEmitter.js";
import { createNotification } from "../../service/notificationService.js";

export const rejectFriendRequest = async (req, res) => {
    try {
        const request = await Friend.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        // only receiver can reject
        if (request.receiver.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const receiver = await User.findById(req.user.id);
        const sender = await User.findById(request.sender);

        // create notification for sender
        await createNotification(
            request.sender,
            req.user.id,
            "friend_reject",
            `${receiver.name} rejected your friend request`
        );

        // email event
        friendEmmiter.emit(
            "friend-rejected",
            receiver,
            sender
        );

        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Request rejected"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};