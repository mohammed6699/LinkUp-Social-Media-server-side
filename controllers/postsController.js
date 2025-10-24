import { imagekit } from "../configs/imgaekit.js";
import Post from "../models/post.js";
import User from "../models/user.js";

// add a new post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { content, post_type } = req.body;
    const images = req.files || [];

    let Image_urls = [];
    if (images.length) {
      Image_urls = await Promise.all(
        images.map(async (img) => {
          const fileBuffer = img.buffer;

          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: img.originalname,
            folder: "posts",
          });

          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });

          return url;
        })
      );
    }

    const newPost = await Post.create({
      user: userId,
      content,
      Image_urls,
      post_type,
    });

    const post = await Post.findById(newPost._id).populate("user", "full_name username profile_picture");

    res
      .status(200)
      .json({ success: true, message: "Post created successfully", post });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get all posts
export const getAllPosts = async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findById(userId);

    // user connections
    const userIds = [userId, ...user.connections];

    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user", "full_name username profile_picture") // populate selected fields
      .populate("comments.user", "full_name username profile_picture") // populate user in comments
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// like/unlike post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.like_count.includes(userId)) {
      // unlike
      post.like_count = post.like_count.filter((id) => id.toString() !== userId);
      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "Post unliked", post });
    } else {
      // like
      post.like_count.push(userId);
      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "Post liked", post });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// add comment
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { postId, text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = {
      user: userId,
      text,
    };

    post.comments.push(comment);
    await post.save();

    res.status(200).json({ success: true, message: "Comment added", post });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// share post
export const sharePost = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.share_count.includes(userId)) {
      // unshare
      post.share_count = post.share_count.filter((id) => id.toString() !== userId);
      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "Post unshared", post });
    } else {
      // share
      post.share_count.push(userId);
      await post.save();
      return res
        .status(200)
        .json({ success: true, message: "Post shared", post });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
