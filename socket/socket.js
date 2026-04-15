import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import Notification from "../models/notification.model.js";

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // ─── User joins — save socketId and mark online ──────────────────────
    // Client emits: socket.emit("setup", userId)
    socket.on("setup", async (userId) => {
      try {
        socket.join(userId); // Join a room with their own userId
        socket.userId = userId;

        // Update user as online
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          socketId: socket.id,
        });

        // ─── DELIVERED: Mark all pending "sent" messages as "delivered" ───
        // When user comes online, all messages sent to them while offline
        // should be marked as "delivered" (double grey tick)
        const userChats = await Chat.find({ participants: userId });
        const chatIds = userChats.map((c) => c._id);

        // Find all "sent" messages in user's chats that they didn't send
        const undeliveredMessages = await Message.find({
          chat: { $in: chatIds },
          sender: { $ne: userId },
          status: "sent",
        });

        if (undeliveredMessages.length > 0) {
          // Bulk update status to "delivered"
          await Message.updateMany(
            {
              chat: { $in: chatIds },
              sender: { $ne: userId },
              status: "sent",
            },
            { $set: { status: "delivered" } }
          );

          // Group messages by sender to notify each sender
          const messagesBySender = {};
          undeliveredMessages.forEach((msg) => {
            const senderId = msg.sender.toString();
            if (!messagesBySender[senderId]) {
              messagesBySender[senderId] = [];
            }
            messagesBySender[senderId].push({
              messageId: msg._id,
              chatId: msg.chat,
            });
          });

          // Notify each sender that their messages were delivered ✅✅ (grey)
          Object.keys(messagesBySender).forEach((senderId) => {
            io.to(senderId).emit("messagesDelivered", {
              deliveredTo: userId,
              messages: messagesBySender[senderId],
            });
          });

          console.log(
            `📬 ${undeliveredMessages.length} messages marked as delivered for user ${userId}`
          );
        }

        // Broadcast to others that this user is online
        socket.broadcast.emit("userOnline", userId);

        // 🔔 Send pending notification count to user
        const unreadNotifCount = await Notification.countDocuments({
          recipient: userId,
          isRead: false,
        });
        socket.emit("notificationCount", { unreadCount: unreadNotifCount });

        console.log(`✅ User ${userId} is online | ${unreadNotifCount} unread notifications`);
      } catch (error) {
        console.error("❌ Socket setup error:", error.message);
      }
    });

    // ─── Join a chat room ────────────────────────────────────────────────
    // Client emits: socket.emit("joinChat", chatId)
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`📫 User joined chat: ${chatId}`);
    });

    // ─── Leave a chat room ───────────────────────────────────────────────
    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log(`📭 User left chat: ${chatId}`);
    });

    // ─── DELIVERED: Real-time — when receiver gets a new message ─────────
    // Client emits after receiving "newMessage" event:
    // socket.emit("messageReceived", { messageId, chatId, senderId })
    socket.on("messageReceived", async ({ messageId, chatId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $set: { status: "delivered" },
        });

        // Notify sender → ✅✅ (double grey tick)
        io.to(senderId).emit("messageDelivered", {
          messageId,
          chatId,
          deliveredTo: socket.userId,
        });
      } catch (error) {
        console.error("❌ Message delivered error:", error.message);
      }
    });

    // ─── SEEN: When user opens a chat and sees messages ──────────────────
    // Client emits when chat is opened/visible:
    // socket.emit("chatOpened", { chatId })
    socket.on("chatOpened", async ({ chatId }) => {
      try {
        const userId = socket.userId;
        if (!userId) return;

        // Find all unread messages (not sent by this user, not yet in readBy)
        const unseenMessages = await Message.find({
          chat: chatId,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });

        if (unseenMessages.length === 0) return;

        // Mark all as "read" and add to readBy
        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: userId },
            readBy: { $ne: userId },
          },
          {
            $addToSet: { readBy: userId },
            $set: { status: "read" },
          }
        );

        // Notify senders → ✅✅ (double blue tick)
        const senderIds = [
          ...new Set(unseenMessages.map((m) => m.sender.toString())),
        ];
        const messageIds = unseenMessages.map((m) => m._id);

        senderIds.forEach((senderId) => {
          io.to(senderId).emit("messagesSeen", {
            chatId,
            seenBy: userId,
            messageIds,
          });
        });

        console.log(
          `👀 ${unseenMessages.length} messages seen by ${userId} in chat ${chatId}`
        );
      } catch (error) {
        console.error("❌ Chat opened (seen) error:", error.message);
      }
    });

    // ─── Typing indicator ────────────────────────────────────────────────
    // Client emits: socket.emit("typing", { chatId, userId })
    socket.on("typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("typing", { chatId, userId });
    });

    // Client emits: socket.emit("stopTyping", { chatId, userId })
    socket.on("stopTyping", ({ chatId, userId }) => {
      socket.to(chatId).emit("stopTyping", { chatId, userId });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      try {
        if (socket.userId) {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
            socketId: null,
          });

          // Broadcast to others that this user is offline
          socket.broadcast.emit("userOffline", {
            userId: socket.userId,
            lastSeen: new Date(),
          });

          console.log(`🔴 User ${socket.userId} is offline`);
        }
      } catch (error) {
        console.error("❌ Socket disconnect error:", error.message);
      }
    });
  });
};

export default setupSocket;
