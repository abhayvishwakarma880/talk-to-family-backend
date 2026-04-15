import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// ─────────────────────────────────────────────────────────────────────────────
// 👤 GET MY PROFILE
// GET /api/user/profile
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ Get Profile Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get profile",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✏️ UPDATE PROFILE (name, about, email)
// PUT /api/user/profile
// Headers: Authorization: Bearer <token>
// Body: { name?, about?, email? }
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, about, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (about !== undefined) user.about = about;
    if (email !== undefined) user.email = email;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🖼️ UPDATE AVATAR (profile picture)
// PUT /api/user/avatar
// Headers: Authorization: Bearer <token>
// Body: multipart/form-data → field "file"
// ─────────────────────────────────────────────────────────────────────────────
export const updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // Delete old avatar from Cloudinary (if exists)
    if (user.avatar.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      } catch (err) {
        console.error("⚠️ Failed to delete old avatar:", err.message);
        // Don't block update if old avatar delete fails
      }
    }

    // Set new avatar from Cloudinary upload (handled by multer middleware)
    user.avatar = {
      public_id: req.file.filename,
      url: req.file.path,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("❌ Update Avatar Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update avatar",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🗑️ REMOVE AVATAR
// DELETE /api/user/avatar
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete from Cloudinary
    if (user.avatar.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      } catch (err) {
        console.error("⚠️ Failed to delete avatar from Cloudinary:", err.message);
      }
    }

    // Reset avatar
    user.avatar = { public_id: null, url: null };
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar removed successfully",
    });
  } catch (error) {
    console.error("❌ Remove Avatar Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove avatar",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔒 CHANGE PASSWORD
// PUT /api/user/change-password
// Headers: Authorization: Bearer <token>
// Body: { oldPassword, newPassword }
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Compare old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Set new password (hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Change Password Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔒 UPDATE PRIVACY SETTINGS
// PUT /api/user/privacy
// Headers: Authorization: Bearer <token>
// Body: { lastSeen?, profilePhoto?, about?, status?, readReceipts?, groups? }
// ─────────────────────────────────────────────────────────────────────────────
export const updatePrivacy = async (req, res) => {
  try {
    const allowedFields = [
      "lastSeen",
      "profilePhoto",
      "about",
      "status",
      "readReceipts",
      "groups",
    ];

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only valid privacy fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user.privacy[field] = req.body[field];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Privacy settings updated",
      privacy: user.privacy,
    });
  } catch (error) {
    console.error("❌ Update Privacy Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update privacy settings",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧹 DELETE ACCOUNT (soft delete)
// DELETE /api/user/account
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isOnline = false;
    user.socketId = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Account Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete account",
    });
  }
};
