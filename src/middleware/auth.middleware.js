import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const authMiddleware = async (req, _, next) => {
    try {
        const token = req.header("Authorization");
        console.log(`Token: ${token}`)

        if (!token) {
            throw new ApiError({
                statusCode: 401,
                error: "Unauthorized, token missing or invalid"
            })
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.userId).select("-password");

        if (!user) {
            throw new ApiError({
                statusCode: 401,
                error: "Unauthorized, token missing or invalid"
            })
        }
        req.user = user
        next()
    } catch (error) {
        next(error);
    }
};