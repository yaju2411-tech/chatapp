import { createNotification } from "../../service/notificationService.js";
import { Friend } from "../../models/Friend.js";
import { friendEmmiter } from "../../emitter/friendEmitter.js";
import { onlineUsers } from "../../socket/socket.js";
import { User } from "../../models/User.js";

export const removeFriend = async (req, res) => {
    try {
        const friendId = req.params.id;
        const friendship = await Friend.findOneAndDelete({
            status: "accepted",
            $or: [
                {
                    sender: req.user.id,
                    receiver: friendId
                },
                {
                    sender: friendId,
                    receiver: req.user.id
                }
            ]
        });
        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: "Friendship not found"
            });
        }
        await createNotification(
            req.user.id,
            friendId,
            "friend_removed",
            `${req.user.name} removed you from friends`
        );
        const sender = await User.findById(req.user.id);
        const receiver = await User.findById(friendId);
        // optional
        friendEmmiter.emit(
            "friend-removed",sender,receiver
        );
        // socket emit
        const socketId = onlineUsers.get(friendId.toString());
        if (socketId) {
            getIo().to(socketId).emit("friend-removed", {
                removedBy: req.user.id
            });
        }
        res.status(200).json({
            success: true,
            message: "Friend removed"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }

}
