import { Router } from "express";
import {
  sendOtpController,
  verifyOtpController,
  registerController,
  loginController,
  resendOtpController,
} from "../controllers/auth.controller.js";

const router = Router();

// 📲 Send OTP to phone number
router.post("/send-otp", sendOtpController);

// ✅ Verify OTP
router.post("/verify-otp", verifyOtpController);

// 📝 Complete registration after OTP verification
router.post("/register", registerController);

// 🔐 Login with phone + password
router.post("/login", loginController);

// 📲 Resend OTP (with 60s cooldown)
router.post("/resend-otp", resendOtpController);

export default router;
