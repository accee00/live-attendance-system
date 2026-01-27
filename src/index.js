import dotenv from "dotenv"
import express from "express";
import mongoose from "mongoose";
import { ApiError } from "./utils/ApiError.js";
dotenv.config({
    path: "./.env"
})

const app = express()

app.use(express.json())

app.use(
    (err, req, res, next) => {
        if (err instanceof ApiError) {
            return res.status(err.statusCode || 500).json({
                success: err.success,
                error: err.error,
            });
        }

        return res.status(500).json({
            success: false,
            error: err.error || "Internal Server Error",
        });
    }
)

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
