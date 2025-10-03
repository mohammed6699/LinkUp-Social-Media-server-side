import express from "express";
import { addUserStory, getUserStory } from "../controllers/storyController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";

const storyRouter = express.Router();
storyRouter.get('/stories', getUserStory)
storyRouter.post('/create', upload.single('media'), protect, addUserStory);

export default storyRouter;