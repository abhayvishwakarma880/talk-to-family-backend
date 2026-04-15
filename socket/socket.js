import User from "../models/user.model.js";

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

        // Broadcast to others that this user is online
        socket.broadcast.emit("userOnline", userId);
        console.log(`✅ User ${userId} is online`);
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
