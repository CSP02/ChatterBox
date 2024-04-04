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

/**
 * ? socket.io events
 */

let activeUsers = []
const url = "http://localhost:3000"
let channelURL = `${url}/@me`
io.on("connection", socket => {
    console.log("|------------------------|\n|    A user connected    |\n|------------------------|\n", socket.id)
    const socketDetails = {
        id: socket.id
    }

    socket.on("JOIN_CHANNEL", data => {
        const channel = data.channel
        const username = data.user.username
        const pfp = data.user.avatarURL
        const colorPrefered = data.user.color

        const user = {
            username: username,
            pfp: pfp,
            color: colorPrefered
        }

        socketDetails.user = user
        activeUsers.push(socketDetails)

        socket.join(`${url}/@me/${channel.name}`)
        channelURL = `${url}/@me/${channel.name}`
        
        io.emit("UPDATE_USERS_LIST", activeUsers);

        console.log("|----------Joined--------|\n")
        console.log(socket.rooms)
        console.log("\n|------------------------|")
    })

    socket.on("LEAVE_CHANNEL", channel => {
        socket.leave(`${url}/@me/${channel.name}`)

        activeUsers = activeUsers.filter(ob => ob.id !== socket.id && ob.user)
        io.emit("UPDATE_USERS_LIST", activeUsers);

        console.clear()
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

        socketDetails.user = user
        activeUsers.push(socketDetails)
        io.emit("LOGIN", { user: user })
        io.emit("UPDATE_USERS_LIST", activeUsers)
    })

    socket.on("MESSAGES", data => {
        io.emit("MESSAGES", "YES")
    })

    socket.on("disconnect", data => {
        activeUsers = activeUsers.filter(ob => ob.id !== socket.id && ob.user)
        io.emit("UPDATE_USERS_LIST", activeUsers);
    })
})
