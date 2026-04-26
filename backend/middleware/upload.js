const cloudinary              = require("cloudinary").v2;
const { CloudinaryStorage }   = require("multer-storage-cloudinary");
const multer                  = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage: organised folder, auto-compressed
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           "farmers-connect/products",
    allowed_formats:  ["jpg", "jpeg", "png", "webp"],
    transformation:   [
      { width:900, height:675, crop:"limit" },
      { quality:"auto:good" },
      { fetch_format:"auto" },
    ],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
    }
    cb(null, true);
  },
});

module.exports = { upload, cloudinary };
