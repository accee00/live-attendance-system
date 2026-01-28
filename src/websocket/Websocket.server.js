import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js"
import { Class } from "../models/class.model.js"
import { Attendance } from "../models/attendance.model.js"

let activeSession = null

const clients = new Set()

export const initWebSocketServer = (server) => {
    const wss = new WebSocketServer({
        server,
        path: '/ws'
    })

    wss.on('connection', async (ws, req) => {
        console.log('New WebSocket connection')

        const token = new URL(req.url, 'http://localhost').searchParams.get('token')

        if (!token) {
            ws.send(JSON.stringify({
                event: 'ERROR',
                message: 'Authentication token required'
            }))
            ws.close()
            return
        }

        try {

            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const user = await User.findById(decoded.userId).select('-password')

            if (!user) {
                ws.send(JSON.stringify({
                    event: 'ERROR',
                    message: 'User not found'
                }))
                ws.close()
                return
            }

            ws.user = {
                userId: user._id.toString(),
                role: user.role,
                name: user.name,
                email: user.email
            }


            clients.add(ws)
            console.log(`User connected: ${ws.user.name} (${ws.user.role})`)

            ws.send(JSON.stringify({
                event: 'CONNECTED',
                message: 'Successfully connected to WebSocket server',
                user: ws.user
            }))


            ws.on('message', async (message) => {
                try {
                    const parsed = JSON.parse(message.toString())
                    await handleWebSocketEvent(ws, parsed)
                } catch (error) {
                    console.error('Error handling message:', error)
                    ws.send(JSON.stringify({
                        event: 'ERROR',
                        message: error.message || 'Invalid message format'
                    }))
                }
            })


            ws.on('close', () => {
                clients.delete(ws)
                console.log(`User disconnected: ${ws.user?.name || 'Unknown'}`)
            })


            ws.on('error', (error) => {
                console.error('WebSocket error:', error)
                clients.delete(ws)
            })

        } catch (error) {
            console.error('Authentication error:', error)
            ws.send(JSON.stringify({
                event: 'ERROR',
                message: 'Invalid authentication token'
            }))
            ws.close()
        }
    })

    return wss
}

const handleWebSocketEvent = async (ws, { event, data }) => {
    console.log(`Event received: ${event} from ${ws.user.role}`)

    switch (event) {
        case 'ATTENDANCE_MARKED':
            await handleAttendanceMarked(ws, data)
            break

        case 'TODAY_SUMMARY':
            await handleTodaySummary(ws)
            break

        case 'MY_ATTENDANCE':
            await handleMyAttendance(ws)
            break

        case 'DONE':
            await handleDone(ws)
            break

        default:
            ws.send(JSON.stringify({
                event: 'ERROR',
                message: `Unknown event: ${event}`
            }))
    }
}

const handleAttendanceMarked = async (ws, data) => {

    if (ws.user.role !== 'teacher') {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'Forbidden: Only teachers can mark attendance'
        }))
    }


    if (!activeSession.classId) {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'No active attendance session. Please start attendance first.'
        }))
    }

    const { studentId, status } = data


    if (!studentId || !status || !['present', 'absent'].includes(status)) {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'Invalid data. studentId and status (present/absent) are required.'
        }))
    }


    activeSession.attendance[studentId] = status


    broadcast({
        event: 'ATTENDANCE_MARKED',
        data: {
            studentId,
            status
        }
    })

    console.log(`Attendance marked: ${studentId} - ${status}`)
}


const handleTodaySummary = async (ws) => {

    if (ws.user.role !== 'teacher') {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'Forbidden: Only teachers can request summary'
        }))
    }


    const attendanceArray = Object.values(activeSession.attendance)

    const present = attendanceArray.filter(status => status === 'present').length
    const absent = attendanceArray.filter(status => status === 'absent').length
    const total = present + absent


    broadcast({
        event: 'TODAY_SUMMARY',
        data: {
            present,
            absent,
            total
        }
    })

    console.log(`Summary broadcast: ${present} present, ${absent} absent, ${total} total`)
}


const handleMyAttendance = async (ws) => {

    if (ws.user.role !== 'student') {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'Forbidden: Only students can check their attendance'
        }))
    }


    const status = activeSession.attendance[ws.user.userId]


    ws.send(JSON.stringify({
        event: 'MY_ATTENDANCE',
        data: {
            status: status || 'not yet updated'
        }
    }))

    console.log(`Student ${ws.user.userId} checked attendance: ${status || 'not yet updated'}`)
}


const handleDone = async (ws) => {

    if (ws.user.role !== 'teacher') {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'Forbidden: Only teachers can end attendance session'
        }))
    }

    if (!activeSession.classId) {
        return ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'No active attendance session'
        }))
    }

    try {

        const classData = await Class.findById(activeSession.classId).select('studentIds')

        if (!classData) {
            return ws.send(JSON.stringify({
                event: 'ERROR',
                message: 'Class not found'
            }))
        }


        classData.studentIds.forEach(studentId => {
            const studentIdStr = studentId.toString()
            if (!activeSession.attendance[studentIdStr]) {
                activeSession.attendance[studentIdStr] = 'absent'
            }
        })


        const attendanceRecords = []
        for (const [studentId, status] of Object.entries(activeSession.attendance)) {
            attendanceRecords.push({
                classId: activeSession.classId,
                studentId,
                status,
                date: new Date()
            })
        }


        await Attendance.insertMany(attendanceRecords)


        const attendanceArray = Object.values(activeSession.attendance)
        const present = attendanceArray.filter(status => status === 'present').length
        const absent = attendanceArray.filter(status => status === 'absent').length
        const total = present + absent


        broadcast({
            event: 'DONE',
            data: {
                message: 'Attendance session completed',
                summary: {
                    present,
                    absent,
                    total
                }
            }
        })

        console.log(`Attendance session completed for class ${activeSession.classId}`)
        console.log(`Final summary: ${present} present, ${absent} absent, ${total} total`)


        activeSession = {
            classId: null,
            startedAt: null,
            attendance: {}
        }

    } catch (error) {
        console.error('Error completing attendance session:', error)
        ws.send(JSON.stringify({
            event: 'ERROR',
            message: 'Failed to complete attendance session'
        }))
    }
}


const broadcast = (message) => {
    const messageStr = JSON.stringify(message)
    clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(messageStr)
        }
    })
}

export const setActiveSession = (classId) => {
    activeSession = {
        classId: classId.toString(),
        startedAt: new Date().toISOString(),
        attendance: {}
    }
    broadcast({
        event: 'ATTENDANCE_STARTED',
        data: {
            classId: classId.toString(),
            startedAt: activeSession.startedAt
        }
    })

    console.log(`Attendance session started for class ${classId}`)
}

export const getActiveSession = () => {
    return activeSession
}