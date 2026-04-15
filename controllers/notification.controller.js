import Notification from "../models/notification.model.js";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// 🔔 GET ALL MY NOTIFICATIONS (with pagination)
// GET /api/notification?page=1&limit=20
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "name phone avatar")
      .populate("chat", "isGroupChat groupName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalNotifications = await Notification.countDocuments({
      recipient: req.user._id,
    });

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      totalNotifications,
      unreadCount,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      notifications,
    });
  } catch (error) {
    console.error("❌ Get Notifications Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get notifications",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔢 GET UNREAD NOTIFICATION COUNT
// GET /api/notification/unread-count
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Unread Count Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get unread count",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 💬 GET UNREAD MESSAGE COUNT PER CHAT
// GET /api/notification/unread-chats
// Headers: Authorization: Bearer <token>
// Returns: [{ chatId, unreadCount }] for each chat with unread messages
// ─────────────────────────────────────────────────────────────────────────────
export const getUnreadChatsCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all chats of this user
    const userChats = await Chat.find({ participants: userId });
    const chatIds = userChats.map((c) => c._id);

    // Aggregate unread message count per chat
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          chat: { $in: chatIds },
          sender: { $ne: userId },
          readBy: { $ne: userId },
          deletedFor: { $ne: userId },
          isDeletedForEveryone: false,
        },
      },
      {
        $group: {
          _id: "$chat",
          unreadCount: { $sum: 1 },
          lastMessage: { $last: "$content" },
          lastMessageAt: { $last: "$createdAt" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    // Format response
    const result = unreadCounts.map((item) => ({
      chatId: item._id,
      unreadCount: item.unreadCount,
      lastMessage: item.lastMessage,
      lastMessageAt: item.lastMessageAt,
    }));

    // Total unread across all chats
    const totalUnread = result.reduce((sum, c) => sum + c.unreadCount, 0);

    return res.status(200).json({
      success: true,
      totalUnread,
      chats: result,
    });
  } catch (error) {
    console.error("❌ Unread Chats Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get unread chat counts",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ MARK SINGLE NOTIFICATION AS READ
// PUT /api/notification/:notificationId/read
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("❌ Mark Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ MARK ALL NOTIFICATIONS AS READ
// PUT /api/notification/read-all
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("❌ Mark All Read Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all as read",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🗑️ DELETE A NOTIFICATION
// DELETE /api/notification/:notificationId
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("❌ Delete Notification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete notification",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧹 CLEAR ALL NOTIFICATIONS
// DELETE /api/notification/clear-all
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("❌ Clear All Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear notifications",
    });
  }
};
