import express from "express";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { ConversationMiddlware } from "../middlware/conversationMiddlware.js";
import { creatorOnlyMiddleware } from "../middlware/creatorOnlyMiddlware.js";
import { adminOnlyMiddleware } from "../middlware/adminOnlyMiddlware.js"
import { updateGroupInfoPermissionMiddleware } from "../middlware/updateGroupInfoMiddlware.js";
import { createConversation } from "../controllers/conversationController/createConversation.js";
import { getMyConversations } from "../controllers/conversationController/getMyConversation.js";
import { getSingleConversation } from "../controllers/conversationController/getSingleConversation.js";
import { deleteConversation } from "../controllers/conversationController/deleteConversation.js";
import { createGroup } from "../controllers/groupController/createGroup.js";
import { addMember } from "../controllers/groupController/addMember.js";
import { removeMember } from "../controllers/groupController/removeMember.js";
import { removeAdmin } from "../controllers/groupController/removeAdmin.js";
import { makeAdmin } from "../controllers/groupController/makeAdmin.js";
import { leaveGroup } from "../controllers/groupController/leaveGroup.js";
import { transferOwnership } from "../controllers/groupController/transferOwnership.js";
import { updateGroupSettings } from "../controllers/groupController/updateGroupSettings.js";
import { getGroupInfo } from "../controllers/groupController/groupInfo.js";
import { deleteGroup } from "../controllers/groupController/deleteGroup.js";
import { updateGroupInfo } from "../controllers/groupController/updateGroupInfo.js";
import { clearGroupChat } from "../controllers/groupController/groupClearChat.js";
import { generateInviteLink } from "../controllers/groupController/generateInviteLink.js";
import { joinByInviteLink } from "../controllers/groupController/joinByInviteLink.js";

const router = express.Router();

router.post("/createConversation",authMiddlware,createConversation);
router.get("/getConversation",authMiddlware,getMyConversations);
router.get("/getConversation/:id",authMiddlware,ConversationMiddlware,getSingleConversation);
router.delete("/deleteConversation/:id",authMiddlware,ConversationMiddlware,deleteConversation);
//group routes
router.post("/group/create-group",authMiddlware,createGroup);
router.patch("/group/:conversationId/add-member",authMiddlware,ConversationMiddlware,addMember);
router.patch("/group/:conversationId/remove-member",authMiddlware,ConversationMiddlware,removeMember);
router.patch("/group/:conversationId/make-admin",authMiddlware,ConversationMiddlware,creatorOnlyMiddleware,makeAdmin);
router.patch("/group/:conversationId/remove-admin",authMiddlware,ConversationMiddlware,creatorOnlyMiddleware,removeAdmin);
router.patch("/group/:conversationId/leave",authMiddlware,ConversationMiddlware,leaveGroup);
router.patch("/group/:conversationId/transfer-ownership",authMiddlware,ConversationMiddlware,creatorOnlyMiddleware,transferOwnership);
router.patch("/group/:conversationId/settings",authMiddlware,ConversationMiddlware,adminOnlyMiddleware,updateGroupSettings);
router.get("/group/:conversationId",authMiddlware,ConversationMiddlware,getGroupInfo);
router.delete("/group/:conversationId",authMiddlware,ConversationMiddlware,creatorOnlyMiddleware,deleteGroup);
router.patch("/group/:conversationId/info",authMiddlware,ConversationMiddlware,updateGroupInfoPermissionMiddleware,updateGroupInfo);
router.delete("/group/:conversationId/clear-chat",authMiddlware,ConversationMiddlware,creatorOnlyMiddleware,clearGroupChat);
router.patch("/group/:conversationId/generate-invite",authMiddlware,ConversationMiddlware,creatorOnlyMiddleware,generateInviteLink);
router.post("/group/join-by-link",authMiddlware,joinByInviteLink);

export default router;