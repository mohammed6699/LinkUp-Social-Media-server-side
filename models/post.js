// create post model
import mongoose from "mongoose";

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
    }]
},
{
    timestamps: true,
    minimize: false
})
const Post = mongoose.model("POst", PostSchema)

export default Post