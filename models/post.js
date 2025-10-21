// create post model
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const PostSchema = new mongoose.Schema({
    user: {
        type: String, 
        ref: 'User',
        required: true
    },
    content: {
        type: String
    },
    Image_urls: [{
        type: String
    }],
    post_type: {
        type: String,
        enum: ['text', 'image', 'text_with_image'],
        required: true
    },
    like_count: [{
        type: String,
        ref: 'User'
    }],
    share_count: [{
        type: String,
        ref: 'User'
    }],
    comments: [commentSchema]
},
{
    timestamps: true,
    minimize: false
})
const Post = mongoose.model("Post", PostSchema)

export default Post