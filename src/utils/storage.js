import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


export const removeLocalFile = (localPath) => {
  try {
    if (localPath && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (error) {
    console.error("Failed to remove local file:", error.message);
  }
};

export const uploadFile = async (req, file) => {
  const isCloudinaryMode =
    process.env.STORAGE_MODE === "cloudinary" &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  
  const normalizedLocalPath = file.path.replace(/\\/g, "/");

  if (isCloudinaryMode) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      const response = await cloudinary.uploader.upload(normalizedLocalPath, {
        folder: "corehub/avatars",
        resource_type: "image",
      });

      removeLocalFile(normalizedLocalPath);

      return {
        url: response.secure_url,
        localPath: "",
      };
    } catch (error) {
      console.error("⚠️ Cloudinary upload failed, falling back to Local Storage:", error.message);
    }
  }

  const publicUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${file.filename}`;

  return {
    url: publicUrl,
    localPath: normalizedLocalPath,
  };
};