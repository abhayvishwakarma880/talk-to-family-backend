import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  getUnreadChatsCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notification.controller.js";

const router = Router();

// 🔒 All routes require login
router.use(protect);

// 🔔 Get all my notifications (paginated)
router.get("/", getMyNotifications);

// 🔢 Get unread notification count
router.get("/unread-count", getUnreadCount);

// 💬 Get unread message count per chat
router.get("/unread-chats", getUnreadChatsCount);

// ✅ Mark all notifications as read
router.put("/read-all", markAllAsRead);

// ✅ Mark single notification as read
router.put("/:notificationId/read", markNotificationAsRead);

// 🧹 Clear all notifications
router.delete("/clear-all", clearAllNotifications);

// 🗑️ Delete single notification
router.delete("/:notificationId", deleteNotification);

export default router;
