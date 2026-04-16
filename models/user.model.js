import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ─── Sub-Schema: Privacy Settings ─────────────────────────────────────────────
// Controls who can see what — mirrors WhatsApp's privacy options
const privacySchema = new mongoose.Schema(
  {
    lastSeen: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone",
    },
    profilePhoto: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone",
    },
    about: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone",
    },
    status: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone",
    },
    // Blue ticks — if false, read receipts won't be sent (lastSeen also hides)
    readReceipts: { type: Boolean, default: true },
    // Who can add this user to groups
    groups: {
      type: String,
      enum: ["everyone", "contacts", "admins"],
      default: "everyone",
    },
  },
  { _id: false } // No separate _id for sub-schema
);

// ─── Sub-Schema: Muted Chat Entry ──────────────────────────────────────────────
const mutedChatSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    muteUntil: { type: Date, default: null }, // null = muted indefinitely
  },
  { _id: false }
);

// ─── Main User Schema ──────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────────────────
    // 🔹 Basic Info
    // ─────────────────────────────────────────────────────────────
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      index: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    avatar: {
      public_id: { type: String, default: null }, // Cloudinary public_id
      url: { type: String, default: null },        // Cloudinary secure URL
    },

    about: {
      type: String,
      default: "Hey there! I am using TalkToFamily 🚀",
      maxlength: [139, "About cannot exceed 139 characters"],
    },

    // ─────────────────────────────────────────────────────────────
    // 🔐 Authentication
    // ─────────────────────────────────────────────────────────────
    password: {
      type: String,
      select: false, // Never returned in queries by default
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // OTP for phone verification
    otp: {
      code: { type: String, default: null },
      expireAt: { type: Date, default: null },
    },

    // 🔒 Two-step verification (WhatsApp PIN)
    twoStepVerification: {
      enabled: { type: Boolean, default: false },
      pin: { type: String, select: false }, // Hashed 6-digit PIN
      recoveryEmail: { type: String, default: null },
    },

    // ─────────────────────────────────────────────────────────────
    // 🚫 Admin-level Block (admin blocks a user from platform)
    // ─────────────────────────────────────────────────────────────
    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedAt: { type: Date, default: null },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    blockReason: {
      type: String,
      default: "",
    },

    // 🚫 User-level Block (user blocks another user — WhatsApp style)
    // Different from admin block — this just hides messages & calls
    blockedContacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ─────────────────────────────────────────────────────────────
    // 🟢 Online / Presence
    // ─────────────────────────────────────────────────────────────
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    // Socket.IO session ID — updated on connect/disconnect
    socketId: {
      type: String,
      default: null,
    },

    // ─────────────────────────────────────────────────────────────
    // 💬 Chat & Contacts
    // ─────────────────────────────────────────────────────────────
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Pinned chats (max 3 like WhatsApp)
    pinnedChats: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "You can pin a maximum of 3 chats",
      },
    },

    // Archived chats (hidden from main list)
    archivedChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],

    // Muted chats — with optional expiry
    mutedChats: [mutedChatSchema],

    // ─────────────────────────────────────────────────────────────
    // 🔒 Privacy Settings
    // ─────────────────────────────────────────────────────────────
    privacy: {
      type: privacySchema,
      default: () => ({}), // Uses all sub-schema defaults
    },

    // ─────────────────────────────────────────────────────────────
    // 🔔 Notifications
    // ─────────────────────────────────────────────────────────────
    notificationEnabled: {
      type: Boolean,
      default: true,
    },

    // Firebase Cloud Messaging token (for push notifications)
    fcmToken: {
      type: String,
      default: null,
    },

    // ─────────────────────────────────────────────────────────────
    // 📱 Device Info
    // ─────────────────────────────────────────────────────────────
    deviceInfo: {
      platform: {
        type: String,
        enum: ["android", "ios", "web", null],
        default: null,
      },
      appVersion: { type: String, default: null },
    },

    // ─────────────────────────────────────────────────────────────
    // 🧹 Soft Delete
    // ─────────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt & updatedAt auto-managed
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ isOnline: 1 });
userSchema.index({ isDeleted: 1, isBlocked: 1 }); // Common query filter

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────
userSchema.pre("save", async function () {
  // Only hash if password is new or modified
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Instance Method: Compare Password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance Method: Get Public Profile ──────────────────────────────────────
// Safe to send to other users (no sensitive fields)
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    phone: this.phone,
    avatar: this.avatar,
    about: this.about,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
  };
};

// ─── Instance Method: Check if OTP is Valid ───────────────────────────────────
userSchema.methods.isOtpValid = function (code) {
  return (
    this.otp.code === code &&
    this.otp.expireAt &&
    new Date() < new Date(this.otp.expireAt)
  );
};

// ─── Instance Method: Clear OTP ───────────────────────────────────────────────
userSchema.methods.clearOtp = function () {
  this.otp.code = null;
  this.otp.expireAt = null;
};

export default mongoose.model("User", userSchema);
