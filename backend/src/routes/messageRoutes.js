import express from "express";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { getMessage } from "../controllers/messageController/getMessage.js";
import { sendMessage } from "../controllers/messageController/sendMessage.js";
import { markMessageSeen } from "../controllers/messageController/markMessageSeen.js";
import { ConversationMiddlware } from "../middlware/conversationMiddlware.js";
import { deleteMessage } from "../controllers/messageController/deleteMessage.js";
import { clearChat } from "../controllers/messageController/clearChat.js";
import { deleteManyMessages } from "../controllers/messageController/deleteMany.js";
import { upload } from "../middlware/uploadMiddlware.js";
import { uploadMediaMessage } from "../controllers/messageController/uploadController.js";
import { forwardMessages } from "../controllers/messageController/forwardController.js";

const router = express.Router();

router.post("/sendMessage",authMiddlware,ConversationMiddlware,sendMessage);
router.get("/:conversationId",authMiddlware,ConversationMiddlware,getMessage);
router.patch("/seen/conversation/:conversationId",authMiddlware,ConversationMiddlware,markMessageSeen);
router.post("/upload/:id",authMiddlware,ConversationMiddlware,upload.single("file"),uploadMediaMessage);
router.delete("/delete/:id",authMiddlware,deleteMessage);
router.delete("/clear/:id",authMiddlware,clearChat);
router.delete("/deleteMany",authMiddlware,deleteManyMessages);
router.post("/forward",authMiddlware,forwardMessages);

export default router;