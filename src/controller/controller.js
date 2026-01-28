import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Class } from "../models/class.model.js";


const signUp = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (
        !name ||
        !email ||
        !password ||
        !role ||
        (role !== "student" && role !== "teacher")
    ) {
        throw new ApiError({
            statusCode: 400,
            error: "Invalid request schema",
        });
    }

    const isEmailPresent = await User.findOne({ email });
    if (isEmailPresent) {
        throw new ApiError({
            statusCode: 400,
            error: "Email already exists",
        });
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    return res.status(201).json(
        new ApiResponse({
            success: true,
            data: user,
        })
    );
});


const signIn = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError({
            statusCode: 400,
            error: "Both fields are required.",
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError({
            statusCode: 400,
            error: "Invalid email or password",
        });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError({
            statusCode: 400,
            error: "Invalid email or password",
        });
    }

    const token = user.generateToken();

    return res.status(200).json(
        new ApiResponse({
            success: true,
            data: { token },
        })
    );
});


const currentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse({
            success: true,
            data: req.user,
        })
    );
});


const createClass = asyncHandler(async (req, res) => {
    const { className } = req.body;

    if (!className) {
        throw new ApiError({
            statusCode: 400,
            error: "Invalid request schema",
        });
    }

    const createdClass = await Class.create({
        className,
        teacherId: req.user._id,
        studentIds: []
    });

    return res.status(201).json(
        new ApiResponse({
            success: true,
            data: createdClass,
        })
    );
});


const addStudentToClass = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!id || !studentId) {
        throw new ApiError({
            statusCode: 400,
            error: "Invalid request schema",
        });
    }

    const findClass = await Class.findById(id);
    if (!findClass) {
        throw new ApiError({
            statusCode: 404,
            error: "Class not found",
        });
    }

    if (!findClass.teacherId.equals(req.user._id)) {
        throw new ApiError({
            statusCode: 403,
            error: "Forbidden, not class teacher",
        });
    }

    const classWithStudents = await Class.findByIdAndUpdate(
        id,
        {
            $addToSet: { studentIds: studentId },
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse({
            success: true,
            data: classWithStudents,
        })
    );
});

const getClassDetail = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) {
        throw new ApiError({
            statusCode: 400,
            error: "Invalid request schema",
        })
    }

    const isAllowed = await Class.exists({
        _id: id,
        $or: [
            { teacherId: req.user._id },
            { studentIds: req.user._id },
        ],
    })

    if (!isAllowed) {
        throw new ApiError({
            statusCode: 403,
            error: "Forbidden, not class teacher or student.",
        })
    }

    const classData = await Class.findById(id).populate({
        path: "studentIds",
    })

    if (!classData) {
        throw new ApiError({
            statusCode: 404,
            error: "Class not found",
        })
    }


    return res.status(200).json(
        new ApiResponse({
            success: true,
            data: {
                _id: classData._id,
                className: classData.className,
                teacherId: classData.teacherId,
                students: classData.studentIds.map((student) => ({
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    role: student.role,
                })),
            },
        })
    )
})

export { signUp, signIn, currentUser, createClass, addStudentToClass, getClassDetail }