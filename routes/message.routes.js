import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../middlewares/upload.js";
import {
  sendMessage,
  getMessages,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markAsRead,
} from "../controllers/message.controller.js";

const router = Router();

// 🔒 All routes require login
router.use(protect);

// 📤 Send message (text or file)
// Use uploadSingle middleware for file uploads — field name: "file"
router.post("/", uploadSingle, sendMessage);

// 📥 Get messages of a chat (with pagination)
router.get("/:chatId", getMessages);

// ✅ Mark messages as read
router.put("/read/:chatId", markAsRead);

// 🗑️ Delete message for me
router.delete("/:messageId", deleteMessageForMe);

// 🗑️ Delete message for everyone
router.delete("/everyone/:messageId", deleteMessageForEveryone);

export default router;
