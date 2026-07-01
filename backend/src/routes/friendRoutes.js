import express from "express";
import { authMiddlware } from "../middlware/authMiddlware.js";
import { sendFriendRequest } from "../controllers/friendController/sendFriendRequest.js";
import { acceptFriendRequest } from "../controllers/friendController/acceeptFriendRequest.js";
import { getPendingFriendRequests } from "../controllers/friendController/getPendingFriendRequest.js";
import { rejectFriendRequest } from "../controllers/friendController/rejectFriendRequest.js";
import { getFriend } from "../controllers/friendController/getFriends.js";
import { removeFriend } from "../controllers/friendController/removeFriend.js";

const router = express.Router();

//send request
router.post("/request/:id",authMiddlware,sendFriendRequest);
router.get("/pending",authMiddlware,getPendingFriendRequests);
router.patch("/accept/:id",authMiddlware,acceptFriendRequest);
router.delete("/reject/:id",authMiddlware,rejectFriendRequest);
router.get("/getFriend",authMiddlware,getFriend);
router.delete("/remove/:id",authMiddlware,removeFriend);

export default router;
