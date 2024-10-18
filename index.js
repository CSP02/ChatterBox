/**
 * ? Importing the packages/libraries
 */
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

/**
 * ? express setup
 */
const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use(cookieParser());

/**
 * ? socket.io setup
 */
const http = require("http").Server(app);
const io = require("socket.io")(http);

http.listen("3000", () => {
    console.log("Listening to 3000");
})

/**
 * ? Tests if the password has a lowercase, an uppercase, a number and if the password is 8 characters or longer
 */
app.post("/ValidatePassword", async (req, res) => {
    const password = await req.body.password;
    if (!password) return res.send({ isValid: false });
    const cond1 = password.length >= 8; // check if the password is 8 characters or longer

    // Check if the chatacter has a lowercase, an uppercase and a number in the password
    const cond2 = (/[a-z]/).test(password) && (/[A-Z]/).test(password) && (/[0-9]/).test(password);
    return res.send({ isValid: cond1 && cond2, charLen8: cond1, mixOfDiff: cond2 }); // return true if both the conditions are true
})

app.get(`/@me/:channel_id`, async (req, res) => {
    res.sendFile(__dirname + "/@me/");
})

app.get(`/gif`, async (req, res) => {
    const query = req.query.q;
    const pos = req.query.pos;
    const limit = req.query.limit;

    await fetch(`https://tenor.googleapis.com/v2/search?q=${query}&limit=${limit}&pos=${pos}&key=${process.env.TENORAPIKEY}&client_key=ChatterBox`).then(async response => {
        if (response.ok) return response.json();
    }).then(response => {
        const results = response.results;
        const next = response.next;
        const resToSend = [];

        results.forEach(result => {
            resToSend.push(result.media_formats.gif.url);
        })

        res.send({ results: resToSend, next: next });
    })
})

/**
 * ? socket.io events
 */

let activeUsers = new Map();
let usersTyping = new Map();

setInterval(() => {
    usersTyping.clear();
}, 5000);

const url = "http://localhost:3000";

io.on("connection", socket => {
    socket.on("SET_UNAME", data => {
        try {
            socket.data.username = data.user.username;
            socket.data.channelId = data.channel ? data.channel._id : data.user.username;
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("JOIN_CHANNEL", data => {
        try {
            const channel = data.channel;
            const username = data.user.username;
            const avatarURL = data.user.avatarURL;
            const colorPrefered = data.user.color;

            const user = {
                username: username,
                avatarURL: avatarURL,
                color: colorPrefered,
            };

            const aUsersInChnl = (activeUsers.has(channel._id) && activeUsers.get(channel._id).length > 0) ? activeUsers.get(channel._id) : [];
            aUsersInChnl.push(user);

            socket.join(`${url}/@me/${channel._id}`);
            io.to(`${url}/@me/${username}`).emit("GET_USERS", channel);
            io.emit("UPDATE_GLOBAL_USERS", { user: username, mode: "online" });
            activeUsers.set(channel._id, aUsersInChnl);
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("LEAVE_CHANNEL", data => {
        try {
            const channel = data.channel;
            const user = data.user;
            socket.leave(`${url}/@me/${channel._id}`);

            const aUsersInChnl = activeUsers.get(channel._id);
            const updatedUsers = [];
            aUsersInChnl.forEach(u => {
                const u2push = {
                    username: u.username,
                    avatarURL: u.avatarURL,
                    color: u.color,
                };

                if (u.username !== user.username) {
                    updatedUsers.push(u2push);
                }
            })
            io.emit("UPDATE_GLOBAL_USERS", { user: user.username, mode: "offline" });
            activeUsers.set(channel._id, updatedUsers);
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("UUL", data => {
        io.to(`${url}/@me/${data.channel._id}`).emit("UPDATE_USERS_LIST", data.members);
    })

    socket.on("LOGIN", data => {
        try {
            const username = data.username;
            const pfp = data.avatarURL;
            const colorPrefered = data.color;

            socket.join(`${url}/@me/${username}`);
            const user = {
                username: username,
                pfp: pfp,
                color: colorPrefered
            };

            io.emit("UPDATE_GLOBAL_USERS", { user: username, mode: "online" });
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("MESSAGES", data => {
        try {
            const channelId = data;
            const channelURL = `${url}/@me/${channelId}`;
            io.to(channelURL).emit("MESSAGES", { _id: data });
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("TYPING", data => {
        try {
            const username = data.username;
            const channelId = data.channelId;

            if (usersTyping.has(channelId)) {
                const channelTypingUsers = usersTyping.get(channelId);
                if (!channelTypingUsers.includes(username)) {
                    channelTypingUsers.push(username);
                    usersTyping.set(channelId, Array.from(new Set(channelTypingUsers).values()));
                }
            }
            else {
                const channelTypUsers = [];
                channelTypUsers.push(username);
                usersTyping.set(channelId, Array.from(new Set(channelTypUsers).values()));
            }

            io.to(`${url}/@me/${channelId}`).emit("TYPING", usersTyping.get(channelId));
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("USER_INVITE", (username, user) => {
        try {
            io.to(`${url}/@me/${username}`).emit("USER_INVITE", `${user.username} added you to a channel`);
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("disconnect", data => {
        try {
            const username = socket.data.username;
            
            [...activeUsers.keys()].forEach(key => {
                const u2push = [];
                [...activeUsers.get(key)].forEach(user => {
                    if (user.username !== username) u2push.push(user);
                });
                activeUsers.set(key, u2push);
            })
            io.emit("UPDATE_GLOBAL_USERS", {user: username, mode: "offline"});
        } catch (error) {
            console.log(error);
        }
    })
})