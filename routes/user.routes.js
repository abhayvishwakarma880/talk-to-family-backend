import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../middlewares/upload.js";
import {
  getMyProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
  changePassword,
  updatePrivacy,
  deleteAccount,
} from "../controllers/user.controller.js";

const router = Router();

// 🔒 All routes below require login (JWT token)
router.use(protect);

// 👤 Profile
router.get("/profile", getMyProfile);
router.put("/profile", updateProfile);

// 🖼️ Avatar
router.put("/avatar", uploadSingle, updateAvatar);
router.delete("/avatar", removeAvatar);

// 🔐 Password
router.put("/change-password", changePassword);

// 🔒 Privacy
router.put("/privacy", updatePrivacy);

// 🧹 Delete account (soft delete)
router.delete("/account", deleteAccount);

export default router;
