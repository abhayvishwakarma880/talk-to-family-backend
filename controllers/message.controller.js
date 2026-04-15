import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

// ─── Helper: detect message type from file mimetype ───────────────────────────
const getMessageType = (mimetype) => {
  if (!mimetype) return "text";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (
    mimetype === "application/pdf" ||
    mimetype.includes("word") ||
    mimetype.includes("excel") ||
    mimetype.includes("spreadsheet") ||
    mimetype.includes("powerpoint") ||
    mimetype.includes("presentation")
  )
    return "document";
  return "file";
};

// ─────────────────────────────────────────────────────────────────────────────
// 📤 SEND MESSAGE (text + optional file)
// POST /api/message
// Body (JSON): { chatId, content, replyTo? }
// Body (form-data): chatId, content?, replyTo?, file
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, replyTo } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required",
      });
    }

    // At least text or file is needed
    if (!content && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Message content or file is required",
      });
    }

    // Verify chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this chat",
      });
    }

    // Build message data
    const messageData = {
      chat: chatId,
      sender: req.user._id,
      content: content || "",
      readBy: [req.user._id], // Sender has already "read" it
    };

    // If file is uploaded via multer/cloudinary
    if (req.file) {
      messageData.messageType = getMessageType(req.file.mimetype);
      messageData.file = {
        public_id: req.file.filename,
        url: req.file.path,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      };
    } else {
      messageData.messageType = "text";
    }

    // Reply to another message
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Create message
    let message = await Message.create(messageData);

    // Update chat's lastMessage
    chat.lastMessage = message._id;
    await chat.save();

    // Populate sender and replyTo for response
    message = await Message.findById(message._id)
      .populate("sender", "name phone avatar")
      .populate("replyTo", "content sender messageType");

    // 🔴 Emit real-time event via Socket.IO (if io exists on app)
    const io = req.app.get("io");
    if (io) {
      // Send to all participants in the chat (except sender)
      chat.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
          io.to(participantId.toString()).emit("newMessage", message);
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    console.error("❌ Send Message Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 📥 GET ALL MESSAGES OF A CHAT (with pagination)
// GET /api/message/:chatId?page=1&limit=50
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this chat",
      });
    }

    // Get messages (excluding "deleted for me")
    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: req.user._id },
    })
      .populate("sender", "name phone avatar")
      .populate("replyTo", "content sender messageType")
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({
      chat: chatId,
      deletedFor: { $ne: req.user._id },
    });

    return res.status(200).json({
      success: true,
      count: messages.length,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
      messages,
    });
  } catch (error) {
    console.error("❌ Get Messages Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get messages",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🗑️ DELETE MESSAGE FOR ME
// DELETE /api/message/:messageId
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Add user to deletedFor array
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted for you",
    });
  } catch (error) {
    console.error("❌ Delete Message Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete message",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🗑️ DELETE MESSAGE FOR EVERYONE
// DELETE /api/message/everyone/:messageId
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can delete for everyone
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can delete a message for everyone",
      });
    }

    message.isDeletedForEveryone = true;
    message.content = "🚫 This message was deleted";
    message.file = { public_id: null, url: null, name: null, size: null, mimeType: null };
    await message.save();

    // Emit real-time delete event
    const io = req.app.get("io");
    if (io) {
      const chat = await Chat.findById(message.chat);
      if (chat) {
        chat.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("messageDeleted", {
            messageId,
            chatId: message.chat,
          });
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted for everyone",
    });
  } catch (error) {
    console.error("❌ Delete For Everyone Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete message",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ MARK MESSAGES AS READ
// PUT /api/message/read/:chatId
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Update all unread messages in this chat (not sent by current user)
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
        $set: { status: "read" },
      }
    );

    // Emit read receipt via socket
    const io = req.app.get("io");
    if (io) {
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.participants.forEach((participantId) => {
          if (participantId.toString() !== req.user._id.toString()) {
            io.to(participantId.toString()).emit("messagesRead", {
              chatId,
              readBy: req.user._id,
            });
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("❌ Mark Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark as read",
    });
  }
};
