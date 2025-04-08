const express = require("express");
const multer = require("multer");
const Post = require("../models/userPostModel");  // ✅ Correct Import
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// 📌 Set up Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });
// const upload = multer({ storage });


// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// Multer Storage Setup with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "uploads",
      resource_type: isVideo ? "video" : "image",  // 🔥 Differentiate between images & videos
      format: isVideo ? "mp4" : "jpg",  // Convert images to jpg, videos to mp4
      public_id: file.originalname.split(".")[0]
    };
  }
});

const upload = multer({ storage: storage });


// POST route to upload image + message
router.post("/upload", upload.single("media"), async (req, res) => {
  try {
    const isVideo = req.file.mimetype.startsWith("video/");
    const newPost = new Post({
      media: req.file.path || req.file.url,  // Image or video URL
      mediaType: isVideo ? "video" : "image",  // Store media type
      message: req.body.message
    });

    await newPost.save();

    res.json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// 📌 SINGLE ROUTE TO HANDLE LIKES & SHARES
router.post("/update/:id", async (req, res) => {
    try {
        const { type } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (type === "like") post.likes += 1;
        else if (type === "share") post.shares += 1;
        else return res.status(400).json({ error: "Invalid update type" });

        await post.save();

        res.json({ 
            success: true, 
            postId: post._id,
            likes: post.likes, 
            shares: post.shares,
            shareableLink: type === "share" ? `http://localhost:5000/api/posts/${post._id}` : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 GET route to fetch all posts (Latest First)
// Cursor-Based Pagination (Better for Infinite Scroll)
router.get("/posts", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // Default: 10 posts per request
    const lastPostId = req.query.lastPostId; // Cursor (ID of the last post from previous batch)

    let query = {};
    if (lastPostId) {
      query._id = { $lt: lastPostId }; // Fetch posts with IDs less than lastPostId (older posts)
    }

    // Fetch posts, sorted by `createdAt` (latest first)
    const posts = await Post.find(query).sort({ createdAt: -1 }).limit(limit);

    // Get the last post ID for next request
    const nextLastPostId = posts.length > 0 ? posts[posts.length - 1]._id : null;

    res.json({
      success: true,
      posts,
      nextLastPostId, // Use this ID for fetching next batch
      hasMore: posts.length === limit, // Indicates if more posts are available
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// use of the api 
// GET /api/posts?limit=10
// GET /api/posts?limit=10&lastPostId=66123abcde45678901234



module.exports = router;
