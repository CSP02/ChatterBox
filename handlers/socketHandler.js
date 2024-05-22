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
        const usersList = document.getElementById("users_list")

        usersList.innerHTML = ""
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
            usersList.appendChild(userDetailsWrapper)
        })
    })

    socket.on("UPDATE_GLOBAL_USERS", user => {
        if (user === null) return
        const usersList = document.getElementById("users_list");

        [...usersList.children].forEach(userEl => {
            const username = userEl.innerText
            const usernameE = user

            if (username === usernameE) userEl.remove()
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
}