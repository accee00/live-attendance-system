import dotenv from "dotenv"
import mongoose from "mongoose";
import { app } from "./app.js";
dotenv.config({
    path: "./.env"
})


async function connectDB() {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected to: ${connection.connection.host}`);
    } catch (error) {
        console.log("DB connection error:", error);
        process.exit(1);
    }
}

connectDB().then(
    () => {
        app.listen(8000, () => {
            console.log(`Server running at http://localhost:8000`);
        })
    }
).catch((error) => {
    console.log(error)
})
