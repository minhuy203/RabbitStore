const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

require("dotenv").config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có tệp nào được tải lên" });
    }

    // Kiểm tra cấu hình Cloudinary
    if (
      !cloudinary.config().cloud_name ||
      !cloudinary.config().api_key ||
      !cloudinary.config().api_secret
    ) {
      return res
        .status(500)
        .json({ message: "Cấu hình Cloudinary không hợp lệ" });
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Lỗi khi tải ảnh lên Cloudinary:", error);
    res.status(500).json({
      message: "Lỗi server: Không thể tải ảnh lên",
      error: error.message,
    });
  }
});

module.exports = router;
