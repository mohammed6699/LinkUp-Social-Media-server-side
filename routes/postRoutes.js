import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { addPost, getAllPosts, likePost, addComment, sharePost } from "../controllers/postsController.js";

const postRoter = express.Router();

postRoter.post('/add', upload.array('images', 4), protect, addPost);
postRoter.get('/feed',  protect, getAllPosts);
postRoter.post('/like',  protect, likePost);
postRoter.post('/comment', protect, addComment);
postRoter.post('/share', protect, sharePost);

export default postRoter;