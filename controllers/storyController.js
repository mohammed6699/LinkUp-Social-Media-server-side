// add user a astory
import  fs  from 'fs';
import { imagekit } from './../configs/imgaekit.js';
import Story from '../models/story.js';
import User from '../models/user.js';
import { inngest } from '../inngest/index.js';
export const addUserStory = async(req, res) => {
    try {
        const {userId} = req.auth;
        const {content, media_type, background_color} = req.body;
        const media = req.file;
        let media_url = '';
        // upload media to image kit
        if(media_type === 'image' || media_type === 'video'){
            const fileBuffer = media.buffer;
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
                folder: 'stories'
            })
            media_url = response.url;
        }
        // create a story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        })
        // schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: {storyId: story._id}
        })
        res.status(200).json({success:true, message: "Story created succefully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message})
    }
}
// get user stories

export const getUserStory = async(req, res) => {
    try {
        const {userId} = req.auth;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // user connections and followings list
        const userIds = [userId, ...user.connections, ...user.following];
        const stories = await Story.find({
            user: {$in: userIds}
        }).populate('user').sort({createdAt: -1}).limit(50);
        res.status(200).json({success: true, stories})
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message})
    }
}