import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import "./config/cloudinary.js"; // Initialize Cloudinary config on startup
import setupSocket from "./socket/socket.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Update with your frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  pingTimeout: 60000, // 60 seconds
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

// Initialize socket event handlers
setupSocket(io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 TalkToFamily API is running!",
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3600;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
