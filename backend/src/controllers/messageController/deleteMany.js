import { Message } from "../../models/Message.js";
import { getIo } from "../../socket/socketServer.js";

export const deleteManyMessages = async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    const messages = await Message.find({
      _id: { $in: messageIds }
    });

    const ids = messages.map((m) => m._id);
    await Message.updateMany(
      {
        _id: { $in: ids },
      }, {
      $set: {
        isDeleted: true,
        text: "This message was deleted",
        gifUrl: "",
        image: "",
        video: "",
        audio: "",
        file: "",
      },
    });
    const io = getIo();
    io.to(conversationId).emit("messages-deleted", {
      conversationId,
      messageIds: ids,
    });
    res.status(200).json({
      success: true,
      messageIds: ids,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};