/**
 * ? Imports
 */
import { GetChannels } from "../ChatterBox/Channel.js"
import { AddToMessages, ScrollToBottom } from "../ChatterBox/Utility.js"
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
        AddToMessages([data], true, params);
        ScrollToBottom(false);
    })

    // Event handler for delete message
    socket.on("DEL_MSG", id => {
        const message = document.getElementById(id);
        if (message.nextSibling === null && message.previousSibling.id === '')
            message.parentElement.parentElement.remove();
        else
            message.remove();
    })

    // Event handler for edit message
    socket.on("EDIT_MSG", data => {
        const tooltipHol = document.createElement("div");
        const editedIndicator = document.createElement("i");
        const tooltipDes = document.createElement("tooltip");
        tooltipDes.innerText = "This message is edited!";
        tooltipHol.style = "position: relative;width:auto;";
        tooltipDes.setAttribute("hang", "top");
        tooltipDes.setAttribute("style", "width: max-content;");

        editedIndicator.setAttribute("tooltip", "true");
        tooltipHol.append(...[editedIndicator, tooltipDes]);
        editedIndicator.classList.add("fa-solid", "fa-pen", "edited_indicator");
        const message = document.getElementById(data.id);
        message.firstChild.innerText = data.content;
        message.previousSibling.appendChild(tooltipHol);
    })

    // This event is when user updates their profile
    socket.on("UPDATE_USERS_LIST", users => {
        const usersSorted = users.sort((a, b) => {
            const unameA = a.username.toUpperCase(); // ignore upper and lowercase
            const unameB = b.username.toUpperCase(); // ignore upper and lowercase
            if (unameA < unameB) {
                return -1;
            }
            if (unameA > unameB) {
                return 1;
            }

            return 0;
        });

        const onlineUsersList = document.getElementById("online_u")
        const offlineUsersList = document.getElementById("offline_u")

        onlineUsersList.innerHTML = ""
        offlineUsersList.innerHTML = ""

        const onlineUsers = []
        const offlineUsers = []

        usersSorted.forEach(user => {
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

        [...onlineUsersList.children].sort((a, b) => {
            const nameA = a.innerText.toUpperCase(); // ignore upper and lowercase
            const nameB = b.innerText.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            // names must be equal
            return 0;
        }).forEach(userEl => {
            const username = userEl.innerText
            const usernameE = data.user

            if (username === usernameE && data.mode === "offline") {
                userEl.remove()
                userEl.classList.replace("online", "offline")
                offlineUsersList.appendChild(userEl)
            }
        });

        [...offlineUsersList.children].sort((a, b) => {
            const nameA = a.innerText.toUpperCase(); // ignore upper and lowercase
            const nameB = b.innerText.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            // names must be equal
            return 0;
        }).forEach(userEl => {
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