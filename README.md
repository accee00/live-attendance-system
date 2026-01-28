# Live Attendance System

## Description
The Live Attendance System is a backend application designed to manage and track attendance in real-time. It provides APIs and WebSocket support for handling attendance data, user authentication, and class management.

## Features
- User authentication and authorization middleware.
- Real-time attendance tracking using WebSocket.
- API error handling and response utilities.
- Modular structure for scalability and maintainability.

## Project Structure
```
src/
├── app.js                 # Main application setup
├── index.js               # Entry point of the application
├── controller/
│   └── controller.js      # Controllers for handling requests
├── middleware/
│   ├── auth.middleware.js # Authentication middleware
│   └── teacher.middleware.js # Middleware for teacher-specific logic
├── models/
│   ├── attendance.model.js # Attendance data model
│   ├── class.model.js      # Class data model
│   └── user.model.js       # User data model
├── utils/
│   ├── ApiError.js         # Custom error handling utility
│   ├── ApiResponse.js      # Standardized API response utility
│   └── AsyncHandler.js     # Utility for handling async operations
└── websocket/
    └── Websocket.server.js # WebSocket server implementation
```
