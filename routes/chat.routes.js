import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  searchUserByPhone,
  createOrGetChat,
  getMyChats,
  deleteChat,
} from "../controllers/chat.controller.js";

const router = Router();

// 🔒 All routes require login
router.use(protect);

// 🔍 Search user by phone number
router.get("/search", searchUserByPhone);

// 💬 Get all my chats (chat list)
router.get("/", getMyChats);

// 💬 Create or get 1-to-1 chat
router.post("/", createOrGetChat);

// 🗑️ Delete a chat
router.delete("/:chatId", deleteChat);

export default router;
