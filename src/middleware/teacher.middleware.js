import { ApiError } from "../utils/ApiError.js"

export const teacherMiddleware = async (req, _, next) => {
    try {
        if (!req.user || req.user.role !== "teacher") {
            throw new ApiError({
                statusCode: 403,
                error: "Forbidden, teacher access required",
            })
        }
        next()
    } catch (error) {
        next(error)
    }
}