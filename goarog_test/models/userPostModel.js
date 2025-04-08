// 📌 MongoDB Schema for Posts
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  media: { type: String, required: true },  // Store Cloudinary URL (Image/Video)
  mediaType: { type: String, enum: ["image", "video"], required: true },  // "image" or "video"
  message: { type: String },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});


// ✅ Directly export the model (No need to redefine it later)
module.exports = mongoose.model("Post", PostSchema);
