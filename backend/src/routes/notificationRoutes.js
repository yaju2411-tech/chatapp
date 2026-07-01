import express from "express";
import { authMiddlware } from "../middlware/authMiddlware.js"
import { getNotifications,markAsRead,markAllAsRead,deleteNotification,clearAllNotification } from "../controllers/notificationController/notificationController.js";

const router = express.Router();

router.get("/",authMiddlware,getNotifications);
// mark single notification read
router.patch("/:id/read",authMiddlware,markAsRead);
// mark all notifications read
router.patch("/read-all",authMiddlware,markAllAsRead);
// delete single notification
router.delete("/:id",authMiddlware,deleteNotification);
// clear all notifications
router.delete("/clear-all",authMiddlware,clearAllNotification);

export default router;