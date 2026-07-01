import { Friend } from "../../models/Friend.js";

export const getFriend = async (req, res) => {
    try {
        const search = req.query.search || "";
        const searchRegex = new RegExp(search, "i");

        const friends = await Friend.find({
            status: "accepted",
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ]
        })
        .populate("sender", "name email avatar")
        .populate("receiver", "name email avatar");

        const result = friends.map(friend => {
            return friend.sender._id.toString() === req.user.id
                ? friend.receiver
                : friend.sender;
        });

        const filteredFriends = result.filter(friend =>
            friend &&
            (
                searchRegex.test(friend.name) ||
                searchRegex.test(friend.email)
            )
        );

        res.status(200).json({
            success: true,
            friends: filteredFriends
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};