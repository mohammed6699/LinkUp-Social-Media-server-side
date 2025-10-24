import express from "express";
import { getChatMessage, getUnreadMessageCount, sendMessage, serverSideController } from "../controllers/messageController.js";
import { upload } from './../configs/multer.js';
import { protect } from './../middlewares/auth.js';

const messageRouter = express.Router();

messageRouter.get('/unread-count', protect, getUnreadMessageCount);
messageRouter.get('/:userId', serverSideController);
messageRouter.post('/send', upload.single('image'), protect, sendMessage);
messageRouter.post('/get', protect, getChatMessage);

export default messageRouter;