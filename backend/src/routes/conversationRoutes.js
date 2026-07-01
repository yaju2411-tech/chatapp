import express from "express";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { createConversation } from "../controllers/conversationController/createConversation.js";
import { getMyConversations } from "../controllers/conversationController/getMyConversation.js";
import { getSingleConversation } from "../controllers/conversationController/getSingleConversation.js";
import { ConversationMiddlware } from "../middlware/conversationMiddlware.js";
import { deleteConversation } from "../controllers/conversationController/deleteConversation.js";

const router = express.Router();

router.post("/createConversation",authMiddlware,createConversation);
router.get("/getConversation",authMiddlware,getMyConversations);
router.get("/getConversation/:id",authMiddlware,ConversationMiddlware,getSingleConversation);
router.delete("/deleteConversation/:id",authMiddlware,ConversationMiddlware,deleteConversation);

export default router;