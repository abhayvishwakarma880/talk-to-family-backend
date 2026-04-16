import User from "../models/user.model.js";
import { generateOtp, getOtpExpiry, sendOtp } from "../utils/sendOtp.js";
import generateToken from "../utils/generateToken.js";

// ─────────────────────────────────────────────────────────────────────────────
// 📲 SEND OTP — Step 1 of registration/login
// POST /api/auth/send-otp
// Body: { phone: "+919876543210" }
// ─────────────────────────────────────────────────────────────────────────────
export const sendOtpController = async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(`📩 OTP Request for: ${phone}`);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Generate OTP & expiry
    const otp = generateOtp();
    const expireAt = getOtpExpiry();

    // Check if user already exists
    let user = await User.findOne({ phone });

    if (user) {
      // Existing user — update OTP
      user.otp = { code: otp, expireAt };
      await user.save();
    } else {
      // New user — create temp entry with OTP (no name/password yet)
      user = await User.create({
        phone,
        name: "User", // Placeholder — updated during registration
        otp: { code: otp, expireAt },
      });
    }

    // Send OTP (Prints to console in dev mode)
    await sendOtp(phone, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      isExistingUser: !!user.isVerified,
      otp, // ⚠️ DEV ONLY
    });
  } catch (error) {
    console.error("❌ Send OTP Error Detail:", error);
    return res.status(500).json({
      success: false,
      message: `Server Error: ${error.message || "Failed to send OTP"}`,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ VERIFY OTP
// POST /api/auth/verify-otp
// Body: { phone: "+919876543210", otp: "123456" }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtpController = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please send OTP first.",
      });
    }

    // Validate OTP using model method
    if (!user.isOtpValid(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clear OTP after successful verification
    user.clearOtp();
    user.isVerified = true;
    await user.save();

    // If user is already fully registered, send token (login flow)
    if (user.isVerified && user.name !== "User") {
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: "OTP verified. Login successful!",
        isNewUser: false,
        token,
        user: user.toPublicProfile(),
      });
    }

    // New user — OTP verified, now needs to complete registration
    return res.status(200).json({
      success: true,
      message: "OTP verified. Complete your registration.",
      isNewUser: true,
      phone: user.phone,
    });
  } catch (error) {
    console.error("❌ Verify OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "OTP verification failed",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 📝 REGISTER — Step 2: Complete profile after OTP verification
// POST /api/auth/register
// Body: { phone, name, password, email? }
// ─────────────────────────────────────────────────────────────────────────────
export const registerController = async (req, res) => {
  try {
    const { phone, name, password, email } = req.body;

    // Validation
    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone, name, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find the OTP-verified user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Phone not found. Please verify OTP first.",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone not verified. Please verify OTP first.",
      });
    }

    // Update user details
    user.name = name;
    user.password = password; // Hashed automatically by pre-save hook
    if (email) user.email = email;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to TalkToFamily 🎉",
      token,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔐 LOGIN (with password — for returning users)
// POST /api/auth/login
// Body: { phone, password }
// ─────────────────────────────────────────────────────────────────────────────
export const loginController = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    // Find user with password field (select: false by default)
    const user = await User.findOne({ phone, isDeleted: false }).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this phone number",
      });
    }

    // Check if admin-level blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Contact support.",
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate token & respond
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 📲 RESEND OTP
// POST /api/auth/resend-otp
// Body: { phone: "+919876543210" }
// ─────────────────────────────────────────────────────────────────────────────
export const resendOtpController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please start registration.",
      });
    }

    // Rate limit — check if last OTP was sent less than 60 seconds ago
    if (user.otp.expireAt) {
      const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
      const otpSentAt = new Date(
        user.otp.expireAt.getTime() - otpExpiryMinutes * 60 * 1000
      );
      const secondsSinceLastOtp = (Date.now() - otpSentAt.getTime()) / 1000;

      if (secondsSinceLastOtp < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - secondsSinceLastOtp)} seconds before requesting a new OTP`,
        });
      }
    }

    // Generate new OTP
    const otp = generateOtp();
    const expireAt = getOtpExpiry();

    user.otp = { code: otp, expireAt };
    await user.save();

    // Send OTP via SMS
    await sendOtp(phone, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      otp, // ⚠️ DEV ONLY — Remove in production
    });
  } catch (error) {
    console.error("❌ Resend OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resend OTP",
    });
  }
};
