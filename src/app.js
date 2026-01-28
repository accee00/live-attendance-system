import express from "express";
import { ApiError } from "./utils/ApiError.js";
import {
    signUp, signIn, currentUser, createClass, addStudentToClass,
    getClassDetail, getAllStudent, getMyAttendance, startAttendance
} from "./controller/controller.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { teacherMiddleware } from "./middleware/teacher.middleware.js"

const app = express();

app.use(express.json());

app.post('/auth/signup', signUp);
app.post('/auth/login', signIn);
app.get('/auth/me', authMiddleware, currentUser);
app.post('/class', authMiddleware, teacherMiddleware, createClass)
app.post('/class/:id/add-student', authMiddleware, teacherMiddleware, addStudentToClass)
app.get('/class/:id', authMiddleware, getClassDetail)
app.get('/students', authMiddleware, teacherMiddleware, getAllStudent)
app.get('/class/:id/my-attendance', authMiddleware, getMyAttendance)
app.post('/attendance/start', authMiddleware, teacherMiddleware, startAttendance)

app.use((err, req, res, next) => {

    console.error("ERROR:", {
        message: err.error || err.message,
        path: req.originalUrl,
        method: req.method,
    });

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
