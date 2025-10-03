import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { addPost, getAllPosts, likePost } from "../controllers/potsController.js";

const postRoter = express.Router();

postRoter.post('/add', upload.array('images', 4), protect, addPost);
postRoter.get('/feed',  protect, getAllPosts);
postRoter.post('/like',  protect, likePost);

export default postRoter;