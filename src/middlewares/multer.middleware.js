import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { ApiError } from "../utils/api-error.js"

const avatarDir = "public/uploads/avatars";

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const uniqueHex = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueHex}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only .jpg, .jpeg, .png, and .webp images are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});