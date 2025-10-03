import { imagekit } from "../configs/imgaekit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/connection.js";
import Post from "../models/post.js";
import User from "../models/user.js";
import fs from 'fs'
// get user data by id
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authenticated" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};
// update user data

// userController.js
export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth;
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Username check
    if (!username) {
      username = tempUser.username;
    } else if (tempUser.username !== username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    const updates = {
      username,
      bio: bio ?? tempUser.bio,
      location: location ?? tempUser.location,
      full_name: full_name ?? tempUser.full_name,
    };

    // Profile image
    if (req.files?.profile?.[0]) {
      const profile = req.files.profile[0];
      const response = await imagekit.upload({
        file: profile.buffer, // works with memoryStorage
        fileName: `profile_${userId}_${Date.now()}`,
        folder: "/profiles",
      });
      updates.profile_picture = response.url; // match model field
    }

    // Cover image
    if (req.files?.cover?.[0]) {
      const cover = req.files.cover[0];
      const response = await imagekit.upload({
        file: cover.buffer,
        fileName: `cover_${userId}_${Date.now()}`,
        folder: "/covers",
      });
      updates.cover_photo = response.url; // match model field
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// find user (search by name, email, username, location)
export const discoverUsers = async(req, res) => {
  try {
      const {userId} = req.auth;
      const {input} = req.body;
      const allUsers = await User.find({
        $or: [
          {username: new RegExp(input, 'i')},
          {email: new RegExp(input, 'i')},
          {full_name: new RegExp(input, 'i')},
          {location: new RegExp(input, 'i')}
        ]
      })
      const filterUsers = allUsers.filter((user) => user._id !== userId);
      res.status(200).json({success: true, users: filterUsers})
  } catch (error) {
     console.error("discover error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
// follow Users
export const followUser = async(req, res) => {
  try {
    // userid => for this user
      const {userId} = req.auth;
      // for other users user want to follow
      const {id} = req.body;
      const user =await User.findById(userId);
      if(user.following.includes(id)){
          return res.status(500).json({success: false, message: `You are already foolowing this ${user}`})
      }
      user.following.push(id)
      await user.save()
      const toUser = await User.findById(id)
      toUser.followers.push(userId)
      await toUser.save();
      res.status(200).json({success: true, message: `You are now following ${toUser.username}`})
    } catch (error) {
     console.error("Follow user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
// unfollow user
export const unfollowUser = async(req, res) => {
  try {
    // userid => for this user
      const {userId} = req.auth;
      // for other users user want to follow
      const {id} = req.body;
      const user =await User.findById(userId);
      user.following = user.following.filter((user) => user !== id);
      await user.save()

      const toUser = await User.findById(id)
      toUser.followers = toUser.followers.filter((user) => user !== userId);
      await toUser.save()
      res.status(200).json({success: true, message: `You are no longer following ${toUser.username}`,})
    } catch (error) {
     console.error("Unfollow user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
// send conection request
export const sendConnectionRequest = async(req, res) => {
  try {
    // id for logged in user
    const {userId} = req.auth;
    // id for other user
    const {id} = req.body;
    if(userId === id){
      return res.status(400).json({
        success: false,
        message: "You cannot send a connection request to yourself"
      });
    }
    // find number of rquestes for user in the past 24h (20 reqs) max
    const last24Hours = new Date(Date.now() -24 *60 *60 *1000);
    // connection sotred in data base
    const connectionReq = await Connection.countDocuments({from_user_id: userId, createdAt: {$gt: last24Hours}})
    if(connectionReq >= 20){
      return res.status(400).json({success: false, message:"You have reached today’s connection request limit"})
    }
    // check if teh users all already connected or not
    const connection = await Connection.findOne({
      $or: [
        {from_user_id: userId, to_user_id: id},
        {from_user_id: id, to_user_id: userId}
      ]
    })
    if(!connection){
      const conn = await Connection.create({from_user_id: userId, to_user_id: id})

      await inngest.send({
        name: 'app/connection-request',
        data: {connId: conn._id}
      })
      return res.status(200).json({success: true, message: 'Connection request send successfully'})
    }
    if(connection && connection.status === 'accepted'){
        return res.status(400).json({success: false, message: "You are already connected"})
    }
    // If it's still pending
    return res.status(400).json({
      success: false,
      message:
        connection.from_user_id === userId
          ? "You already sent a request to this user"
          : "This user already sent you a request",
    });
  } catch (error) {
    console.error("send connection request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
// get user conections
export const getUserConnections = async (req, res) => {
  try {
    const {userId} = req.auth;
    const user = await User.findById(userId).populate('connections').populate('followers').populate('following');
    const connections = user.connections;
    const following = user.following;
    const followers = user.followers;
    const pendingConnections = 
    (await Connection.find({to_user_id: userId, status: 'pending'}).populate('from_user_id')).
    map((connection) => connection.from_user_id);

    res.status(200).json({success: true, connections, followers, following, pendingConnections});
    } catch (error) {
    console.error("get user conections error error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
// Accept connection request
export const acceptConnectionRequest = async (req, res) =>{
 try {
    const {userId} = req.auth;
    const {id} = req.body;

    const connection = await Connection.findOne({from_user_id: id, to_user_id: userId});
    if(!connection){
      return res.status(404).json({success: false, message: 'No connection request found'})
    }

    const user = await User.findById(userId);
    if(!user.connections.includes(id)){
      user.connections.push(id)
      await user.save();
    }

    const toUser = await User.findById(id);
    if(!toUser.connections.includes(userId)){
      toUser.connections.push(userId);
      await toUser.save();
    }

    connection.status = 'accepted';
    await connection.save()

    res.status(200).json({success: true, message: 'Connection acceppted'});
 } catch (error) {
    console.error(" Accepted connection request error:", error);
    res.status(500).json({ success: false, message: error.message });
 }
}
// get user profiles

export const getUserProfiles = async(req, res) => {
    try {
      const {profileId} = req.body;
      const profile = await User.findById(profileId)
      if(!profile){
        return res.status(404).json({success: false, message: 'profile not found'})
      }
      const posts = await Post.find({
        user: profileId
      }).populate('user')

      res.status(200).json({success: true, posts})
    } catch (error) {
      console.log(error)
      res.status(500).json({success: false, message: error.message})
    }
}