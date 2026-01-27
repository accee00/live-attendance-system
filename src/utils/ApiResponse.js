class ApiResponse {
    constructor({ success = true, data = null }) {
        this.success = success
        this.data = data
    }
}
export { ApiResponse }