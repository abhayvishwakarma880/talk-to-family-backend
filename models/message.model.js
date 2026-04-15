import mongoose from "mongoose";

// ─── Message Schema ───────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    // Which chat this message belongs to
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    // Who sent this message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Text content (can be empty if it's a file-only message)
    content: {
      type: String,
      trim: true,
      default: "",
    },

    // Message type
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "file"],
      default: "text",
    },

    // File attachment (for image, video, audio, document, file types)
    file: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
      name: { type: String, default: null },       // Original file name
      size: { type: Number, default: null },        // Size in bytes
      mimeType: { type: String, default: null },    // e.g. "image/jpeg"
    },

    // Read receipts — array of users who have read this message
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Message delivery status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    // Soft delete — "Delete for me"
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // "Delete for everyone" (WhatsApp style)
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying
messageSchema.index({ chat: 1, createdAt: -1 }); // Messages in a chat sorted by time
messageSchema.index({ sender: 1 });

export default mongoose.model("Message", messageSchema);
