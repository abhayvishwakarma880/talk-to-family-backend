import mongoose from "mongoose";

// ─── Chat Schema ──────────────────────────────────────────────────────────────
// Represents a conversation between 2 users (1-to-1) or a group chat
const chatSchema = new mongoose.Schema(
  {
    // Participants in this chat
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Group chat fields (for future use)
    isGroupChat: {
      type: Boolean,
      default: false,
    },

    groupName: {
      type: String,
      trim: true,
      default: null,
    },

    groupAvatar: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },

    // Group admin (only for group chats)
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Last message — for chat list preview (like WhatsApp main screen)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for quick lookup of a user's chats
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 }); // Sort by latest activity

export default mongoose.model("Chat", chatSchema);
