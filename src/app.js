import express from "express";
import { ApiError } from "./utils/ApiError.js";
import { signUp, signIn, currentUser, createClass } from "./controller/controller.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { teacherMiddleware } from "./middleware/teacher.middleware.js"

const app = express();

app.use(express.json());

app.post('/auth/signup', signUp);
app.post('/auth/login', signIn);
app.get('/auth/me', authMiddleware, currentUser);
app.post('/class', authMiddleware, teacherMiddleware, createClass)

app.use((err, req, res, next) => {
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
});

export { app };
