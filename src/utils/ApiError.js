class ApiError {
    constructor({ statusCode, error = 'An unknown error occurred.', success = false }) {
        this.statusCode = statusCode
        this.success = success
        this.error = error
    }
}
export { ApiError }