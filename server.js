import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToDb from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from './inngest/index.js';
dotenv.config();

const app = express();
await connectToDb()
app.use(express.json());
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use(cors());
app.get('/', (req, res) => {
    res.send("Server is running !")
})
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})