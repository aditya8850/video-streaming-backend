import dotenv from "dotenv";
dotenv.config(); // Load environment variables


import connectDB from "./db/index.js"; // Ensure this path is correct
connectDB();
