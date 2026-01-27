class ApiError {
    constructor({ error = 'An unknown error occurred.', success = false }) {
        this.success = success
        this.error = error
    }
}
