import dotenv from "dotenv"
import express from "express";
import mongoose from "mongoose";

dotenv.config({
    path: "./.env"
})

const app = express()

app.use(express.json())


async function connectDB() {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected to: ${connection.connection.host}`);
    } catch (error) {
        console.log("DB connection error:", error);
        process.exit(1);
    }
}

connectDB()
