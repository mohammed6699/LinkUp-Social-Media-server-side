import { Server } from "socket.io";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("join_chat", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined chat`);
    });

    socket.on("send_message", (message) => {
      io.to(message.to_user_id).emit("receive_message", message);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });

  return io;
};

export default initializeSocket;