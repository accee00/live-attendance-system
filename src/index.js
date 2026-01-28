import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { app } from "./app.js";
import { initWebSocketServer } from "./websocket/Websocket.server.js";

dotenv.config({
    path: "./.env"
});

async function connectDB() {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected to: ${connection.connection.host}`);
    } catch (error) {
        console.log("DB connection error:", error);
        process.exit(1);
    }
}

connectDB().then(() => {
    const server = http.createServer(app);
    initWebSocketServer(server);
    const PORT = 8000;
    server.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
        console.log(`WebSocket Server ready at ws://localhost:${PORT}/ws`);
    });
}).catch((error) => {
    console.log("Startup error:", error);
    process.exit(1);

});