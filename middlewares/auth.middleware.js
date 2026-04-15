import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// ─── Auth Middleware — Protect Routes ──────────────────────────────────────────
// Checks JWT token from Authorization header and attaches user to req
export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to request (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token is invalid.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Contact support.",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
