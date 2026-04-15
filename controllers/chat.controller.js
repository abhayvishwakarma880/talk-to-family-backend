import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 SEARCH USER BY PHONE NUMBER
// GET /api/chat/search?phone=9876543210
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const searchUserByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for search",
      });
    }

    // Search with partial match (user can type without country code too)
    const users = await User.find({
      phone: { $regex: phone, $options: "i" },
      _id: { $ne: req.user._id },       // Don't show yourself
      isDeleted: false,
      isBlocked: false,
    }).select("name phone avatar about isOnline lastSeen");

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("❌ Search User Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Search failed",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 💬 CREATE OR GET 1-TO-1 CHAT
// POST /api/chat
// Body: { receiverId: "userId" }
// If chat already exists between 2 users, returns existing chat
// ─────────────────────────────────────────────────────────────────────────────
export const createOrGetChat = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (receiverId === senderId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself",
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if 1-to-1 chat already exists between these 2 users
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [senderId, receiverId], $size: 2 },
    })
      .populate("participants", "name phone avatar about isOnline lastSeen")
      .populate("lastMessage");

    if (chat) {
      return res.status(200).json({
        success: true,
        message: "Chat already exists",
        chat,
      });
    }

    // Create new chat
    chat = await Chat.create({
      participants: [senderId, receiverId],
      isGroupChat: false,
    });

    // Populate and return
    chat = await Chat.findById(chat._id).populate(
      "participants",
      "name phone avatar about isOnline lastSeen"
    );

    return res.status(201).json({
      success: true,
      message: "Chat created successfully",
      chat,
    });
  } catch (error) {
    console.error("❌ Create Chat Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create chat",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 📋 GET ALL MY CHATS (Chat list — like WhatsApp main screen)
// GET /api/chat
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", "name phone avatar about isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name phone avatar",
        },
      })
      .sort({ updatedAt: -1 }); // Latest chat first

    return res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    console.error("❌ Get Chats Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get chats",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🗑️ DELETE CHAT (for me — removes from my chat list)
// DELETE /api/chat/:chatId
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Verify user is part of this chat
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this chat",
      });
    }

    // Remove user from participants
    chat.participants = chat.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );

    // If no participants left, delete the chat entirely
    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
    } else {
      await chat.save();
    }

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Chat Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete chat",
    });
  }
};
