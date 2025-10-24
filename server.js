import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import connectToDb from "./configs/db.js";
import initializeSocket from "./configs/socket.js";
import { serve } from "inngest/express";
import { inngest, functions } from './inngest/index.js';
import { clerkMiddleware } from '@clerk/express'
import userRouter from "./routes/userRoutes.js";
import postRoter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
// cleerkmiddleware to add the auth property so you can use it 
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Initialize socket.io
const io = initializeSocket(httpServer);

// Middlewares
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// clerk middleware
app.use(clerkMiddleware());

// Inngest route
app.use("/api/inngest", serve({ client: inngest, functions }));

// Root route
app.get("/", (req, res) => {
  res.send("Server is running !");
});
app.use('/api',userRouter)
app.use('/api/post', postRoter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)
// Start server only after DB connects
connectToDb().then(() => {
  httpServer.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
  });
}).catch((err) => {
  console.error("❌ Failed to connect to DB:", err.message);
});