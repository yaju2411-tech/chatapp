import { Message } from "../../models/Message.js";

export const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }
        message.isDeleted = true;
        message.text = "This message was deleted";
        message.gifUrl = "";
        message.image = "";
        message.video = "";
        message.audio = "";
        message.file = "";
        await message.save();
        getIo().to(message.conversation.toString()).emit("message-deleted", {
            messageId: message._id
        });
        res.status(200).json({
            success: true,
            message: "Message deleted"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}
