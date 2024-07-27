/**
 * ? Imports
 */
import { GetChannels } from "../ChatterBox/Channel.js"
import { GetMessages } from "../ChatterBox/Message.js"
/**
 * ? method to handle all the sockets events
 */
export function HandleSocketEvents(socket, params) {
    socket.on("connect", data => {
        const user = JSON.parse(window.sessionStorage.getItem("user"))
        const channel = JSON.parse(window.sessionStorage.getItem("active_channel"))
        socket.emit("SET_UNAME", { user: user, channel: channel })
    })

    // Send the user details of a newly logged user to everyone who connected to the socket
    socket.on("LOGIN", data => {
        socket.emit("MEMBER_ADD", data.user)
    })

    // Get all messages when someone sent a message
    socket.on("MESSAGES", data => {
        GetMessages(data, params)
    })

    // This event is when user updates their profile
    socket.on("UPDATE_USERS_LIST", users => {
        const onlineUsersList = document.getElementById("online_u")
        const offlineUsersList = document.getElementById("offline_u")

        onlineUsersList.innerHTML = ""
        offlineUsersList.innerHTML = ""

        const onlineUsers = []
        const offlineUsers = []

        users.forEach(user => {
            const userDetailsWrapper = document.createElement("div")
            const username = document.createElement("p")
            let pfp = new Image()

            username.innerText = user.username
            username.style.color = user.color

            if (user.avatarURL && user.avatarURL !== "undefined") pfp.src = user.avatarURL
            else {
                pfp = document.createElement("div")
                pfp.innerText = user.username.split("")[0].toUpperCase()
                pfp.style.backgroundColor = user.color
            }

            pfp.classList.add("pfp")
            userDetailsWrapper.append(...[pfp, username])
            userDetailsWrapper.classList.add("online_users")
            if (user.status === 1) {
                userDetailsWrapper.classList.add("online")
                onlineUsers.push(userDetailsWrapper)
            }
            else {
                userDetailsWrapper.classList.add("offline")
                offlineUsers.push(userDetailsWrapper)
            }
        })
        onlineUsersList.append(...onlineUsers)
        offlineUsersList.append(...offlineUsers)
    })

    socket.on("UPDATE_GLOBAL_USERS", data => {
        if (data.user === null) return
        const onlineUsersList = document.getElementById("online_u");
        const offlineUsersList = document.getElementById("offline_u");

        [...onlineUsersList.children].forEach(userEl => {
            const username = userEl.innerText
            const usernameE = data.user

            if (username === usernameE && data.mode === "offline") {
                userEl.remove()
                userEl.classList.replace("online", "offline")
                offlineUsersList.appendChild(userEl)
            }
        });
        
        [...offlineUsersList.children].forEach(userEl => {
            const username = userEl.innerText
            const usernameE = data.user

            if (username === usernameE && data.mode === "online") {
                userEl.remove()
                userEl.classList.replace("offline", "online")
                onlineUsersList.appendChild(userEl)
            }
        })
    })

    const actionIndicator = document.getElementById("action_indicator")

    socket.on("TYPING", usernames => {
        const usersSet = new Set(usernames)
        const text = document.createTextNode([...Array.from(usersSet.values())].join(", "))
        if (Array.from(usersSet.values()).length < 4)
            actionIndicator.innerText = text.data + `${usernames.length === 1 ? " is" : " are"} typing`
        else
            actionIndicator.innerText = "Several people are typing"
    })

    setInterval(() => {
        actionIndicator.innerHTML = ""
    }, 10000)

    socket.on("USER_INVITE", data => {
        const notification = document.getElementById("notification")

        const notificationTone = document.createElement("audio")
        notificationTone.src = "/Resources/notification_tone.mp3"

        notificationTone.style.display = "none"
        notification.innerText = data
        notification.style.marginTop = "0"

        document.body.appendChild(notificationTone)
        notificationTone.play()

        setTimeout(() => {
            notification.style.marginTop = "-100%"
        }, 3000);
        GetChannels(params)
    })

    socket.on("GET_USERS", channel => {
        const headers = new Headers
        headers.append("authorization", `Bearer ${window.sessionStorage.getItem("token")}`)
        fetch(`http://localhost:3001/api/get_users?cid=${channel._id}`, {
            mode: "cors",
            headers: headers
        }).then(async response => {
            if (response.ok) return response.json()
        }).then(response => {
            const members = response.members
            const channel = JSON.parse(window.sessionStorage.getItem("active_channel"))

            socket.emit("UUL", {
                members: members, channel: channel
            })
        })
    })
}