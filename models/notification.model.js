import mongoose from "mongoose";

// ─── Notification Schema ──────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Who triggered this notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification type
    type: {
      type: String,
      enum: [
        "new_message",       // New text/file message
        "missed_call",       // Missed voice/video call (future)
        "group_invite",      // Added to a group (future)
        "group_removed",     // Removed from group (future)
        "contact_joined",    // A contact joined the app
        "status_update",     // Someone posted a status (future)
      ],
      required: true,
    },

    // Notification title (shown in notification bar)
    title: {
      type: String,
      required: true,
    },

    // Notification body/description
    body: {
      type: String,
      required: true,
    },

    // Reference to related chat (if applicable)
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    // Reference to related message (if applicable)
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Is notification read?
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
