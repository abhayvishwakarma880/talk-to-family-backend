import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ─── Helper: auto-detect resource type ────────────────────────────────────────
// Cloudinary supports: "image" | "video" | "raw" (for docs/files)
const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/") || mimetype.startsWith("audio/")) return "video";
  return "raw"; // PDFs, docs, excel, zip, etc.
};

// ─── Cloudinary Storage Engine ────────────────────────────────────────────────
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const resourceType = getResourceType(file.mimetype);

    return {
      folder: `talkToFamily/${resourceType}s`, // talkToFamily/images | videos | raws
      resource_type: resourceType,
      // Keep original file name (sanitized) instead of a random hash
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")}`,
      // Image-only transformations (ignored for raw/video)
      ...(resourceType === "image" && {
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      }),
    };
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ALLOWED_MIME_TYPES = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-rar-compressed",
    "text/plain",
  ];

  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // Accept
  } else {
    cb(new Error(`❌ File type "${file.mimetype}" is not allowed!`), false);
  }
};

// ─── Multer Upload Instance ───────────────────────────────────────────────────
const upload = multer({
  storage: cloudinaryStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max per file
  },
});

// ─── Named Export Helpers ─────────────────────────────────────────────────────
// Use these directly in routes as middleware

/** Single file upload → field name: "file" */
export const uploadSingle = upload.single("file");

/** Multiple files (same field) → field name: "files", max 10 */
export const uploadMultiple = upload.array("files", 10);

/** Multiple fields with different names */
export const uploadFields = (fields) => upload.fields(fields);
// Usage: uploadFields([{ name: "avatar", maxCount: 1 }, { name: "docs", maxCount: 5 }])

export default upload;
