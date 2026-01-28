import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Class } from "../models/class.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const signUp = async (req, res) => {
    try {
        const { name, email, password, role } = req.body

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
            })
        }

        const isEmailPresent = await User.findOne({ email })

        if (isEmailPresent) {
            throw new ApiError({
                statusCode: 400,
                error: "Email already exists",
            })
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
        })

        return res.status(201).json(
            new ApiResponse({
                success: true,
                data: user,
            })
        )
    } catch (error) {
        throw error;
    }
}

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            throw new ApiError({
                statusCode: 400,
                error: "Both fields are required.",
                success: false,
            })
        }

        const user = await User.findOne({ email: email })

        if (!user) {
            throw new ApiError({
                statusCode: 400,
                error: "Invalid email or password",
                success: false,
            })
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password)

        if (!isPasswordCorrect) {
            throw new ApiError({
                statusCode: 400,
                error: "Invalid email or password",
                success: false,
            })
        }

        const token = user.generateToken()

        return res.status(200).json(
            new ApiResponse({
                success: true,
                data: {
                    token
                }
            })
        )
    } catch (error) {
        throw error;
    }
}

const currentUser = async (req, res) => {
    try {
        return res.status(200).json(
            new ApiResponse({
                success: true,
                data: req.user,
            })
        );
    } catch (error) {
        throw error;
    }
};

const createClass = async (req, res) => {
    try {
        const { className } = req.body
        if (!className) {
            throw new ApiError({
                statusCode: 400,
                error: "Invalid request schema",
                success: false,
            })
        }

        const createdClass = await Class.create({
            className,
            teacherId: req.user._id
        })
        res.status(201).json(
            new ApiResponse({
                success: true,
                data: createdClass
            })
        )
    } catch (error) {
        throw error;
    }
}

export { signUp, signIn, currentUser, createClass }
