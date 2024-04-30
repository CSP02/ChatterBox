/**
 * ? Importing the packages/libraries
 */
const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

/**
 * ? express setup
 */
const app = express();
app.use(express.json())
app.use(express.static(__dirname))
app.use(cookieParser())

/**
 * ? socket.io setup
 */
const http = require("http").Server(app)
const io = require("socket.io")(http)

http.listen("3000", () => {
    console.log("Listening to 3000")
})

/**
 * ? Tests if the password has a lowercase, an uppercase, a number and if the password is 8 characters or longer
 */
app.post("/ValidatePassword", async (req, res) => {
    const password = await req.body.password
    if (!password) return res.send({ isValid: false })
    const cond1 = password.length >= 8 // check if the password is 8 characters or longer

    // Check if the chatacter has a lowercase, an uppercase and a number in the password
    const cond2 = (/[a-z]/).test(password) && (/[A-Z]/).test(password) && (/[0-9]/).test(password)
    return res.send({ isValid: cond1 && cond2, charLen8: cond1, mixOfDiff: cond2 }) // return true if both the conditions are true
})

app.get(`/@me/:channel_id`, async (req, res) => {
    res.sendFile(__dirname + "/@me/")
})

/**
 * ? socket.io events
 */

let activeUsers = new Map()
let usersTyping = []
let isCooled = true

setInterval(() => {
    usersTyping = []
    isCooled = true
}, 3000)

const url = "http://localhost:3000"

io.on("connection", socket => {
    const socketDetails = {
        id: socket.id
    }

    socket.on("JOIN_CHANNEL", data => {
        const channel = data.channel
        const username = data.user.username
        const pfp = data.user.avatarURL
        const colorPrefered = data.user.color

        if (!activeUsers.has(channel._id)) activeUsers.set(channel._id, [])

        const user = {
            username: username,
            pfp: pfp,
            color: colorPrefered
        }

        socketDetails.user = user
        // activeUsers.push(socketDetails)

        socket.join(`${url}/@me/${channel._id}`)
        const users = activeUsers.get(channel._id)
        // if (users === undefined) activeUsers.set(channel._id, [])
        users.push(socketDetails)
        activeUsers.set(channel._id, users)
        console.log(activeUsers)

        io.to(`${url}/@me/${channel._id}`).emit("UPDATE_USERS_LIST", users);

        console.log("|----------Joined--------|\n")
        console.log(socket.rooms)
        console.log("\n|------------------------|")
    })

    socket.on("LEAVE_CHANNEL", data => {
        const channel = data
        socket.leave(`${url}/@me/${channel._id}`)

        if (!activeUsers.has(channel._id)) activeUsers.set(channel._id, [])

        const allUsers = activeUsers.get(channel._id)
        const users = allUsers.filter(ob => ob.id !== socket.id && ob.user)
        activeUsers.set(channel._id, users)
        io.to(`${url}/@me/${channel._id}`).emit("UPDATE_USERS_LIST", users);

        console.clear()
        console.log(channel._id)
        console.log("|----------Leaved--------|\n")
        console.log(socket.rooms)
        console.log("\n|------------------------|")
    })

    // Catches the login event from a client and sends the user details for every other clients
    socket.on("LOGIN", data => {
        const username = data.username
        const pfp = data.avatarURL
        const colorPrefered = data.color

        const user = {
            username: username,
            pfp: pfp,
            color: colorPrefered
        }

        io.emit("LOGIN", { user: user })
    })

    socket.on("MESSAGES", data => {
        const channelId = data
        const channelURL = `${url}/@me/${channelId}`
        io.to(channelURL).emit("MESSAGES", { _id: data })
    })

    socket.on("TYPING", data => {
        const username = data.username
        const channelId = data.channelId

        if (!usersTyping.includes(username))
            usersTyping.push(username)

        if (isCooled) {
            io.to(`${url}/@me/${channelId}`).emit("TYPING", usersTyping)
            isCooled = false
        }
    })

    socket.on("disconnect", data => {
        console.log(data)
        // const allUsers = activeUsers.get(channel._id)
        // const users = allUsers.filter(ob => ob.id !== socket.id && ob.user)
        // activeUsers.set(channel._id, users)

        // io.emit("UPDATE_USERS_LIST", activeUsers);
    })
})
