import { imagekit } from "../configs/imgaekit.js";
import Message from "../models/message.js";

// create an object to store server side event for real time message (real time chat)
const connections = {};
// controller for server side connection
export const serverSideController = async (req, res) => {
    const {userId} = req.params;
    console.log('new client connected: ', userId);
    // set server side event
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // add the client's response object to the connection object
    connections[userId] = res;

    // send an intial event to the client
    res.write('log: Connected to server side stream\n\n');

    // handle client disconnection
    res.on('close', () => {
        // remove the cleint's response object from connection array
        delete connections[userId];
        console.log('CLient Disconnected: ', userId)
    })
}

// send message
export const sendMessage = async (req, res) => {
    try {
        const {userId} = req.auth;
        console.log(req.body);
        const {to_user_id, test} = req.body;
        const image = req.file;
        let media_url = "";
        let message_type = image ? 'image': 'text';
        if(message_type === 'image'){
            const fileBuffer = image.buffer;
            const respone = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
                folder: 'messages'
            });
            media_url = imagekit.url({
                path: respone.filePath,
                transformation: [
                    {quality: 'auto'},
                    {format: 'webp'},
                    {width: '1280'}
                ]
            })
        }
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            test,
            message_type,
            media_url
        })

        res.status(200).json({success: true, message})
        // send mesage to userId in real time
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id');
        req.io.to(to_user_id).emit("receive_message", messageWithUserData);
        if(connections[to_user_id]){
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message})
    }
}
// get chat message
export const getChatMessage = async (req, res) => {
    try {
        const {userId} = req.auth;
        const {to_user_id} = req.body;
        const messages = await Message.find({
            $or: [{from_user_id: userId, to_user_id},
                  {from_user_id: to_user_id, to_user_id: userId}
            ]
        }).sort({createdAt: -1})
        // mark as seen
        await Message.updateMany({from_user_id: to_user_id, to_user_id: userId}, {seen: true})
        res.status(200).json({success: true, messages})
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message})   
    }
}

// get recent messages
export const getUnreadMessageCount = async(req, res) => {
    try {
        const {userId} = req.auth
        const count = await Message.countDocuments({to_user_id: userId, seen: false})
        res.status(200).json({success: true, count})
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message})
    }
}