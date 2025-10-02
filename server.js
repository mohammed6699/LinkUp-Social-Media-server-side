import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToDb from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from './inngest/index.js';
import { clerkMiddleware } from '@clerk/express'
import userRouter from "./routes/userRoutes.js";
// cleerkmiddleware to add the auth property so you can use it 
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
// clerk middleware
app.use(clerkMiddleware());

// Inngest route
app.use("/api/inngest", serve({ client: inngest, functions }));

// Root route
app.get("/", (req, res) => {
  res.send("Server is running !");
});
app.use('/api',userRouter)
// Start server only after DB connects
connectToDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
  });
}).catch((err) => {
  console.error("❌ Failed to connect to DB:", err.message);
});