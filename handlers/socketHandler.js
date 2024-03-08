/**
 * ? Imports
 */
import { GetAllMessages } from "../ChatterBox/Message.js"

/**
 * ? method to handle all the sockets events
 */
export function HandleSocketEvents() {
    const socket = io()

    // Send the user details of a newly logged user to everyone who connected to the socket
    socket.on("LOGIN", data => {
        socket.emit("MEMBER_ADD", data.user)
    })

    // Get all messages when someone sent a message
    socket.on("MESSAGES", data => {
        GetAllMessages()
    })

    // This event is when user updates their profile
    socket.on("UPDATE_USERS_LIST", users => {
        const currentUsers = []
        const usersList = document.getElementById("users_list")
        const allUsersWrapper = document.createElement("div")

        users.forEach(user => {
            for (let i = 0; i < currentUsers.length; i++) {
                const currentUser = currentUsers[i]

                if (currentUser.username === user.user.username) return
            }
            currentUsers.push(user.user)

            const userDetailsWrapper = document.createElement("div")
            const username = document.createElement("p")
            let pfp = new Image()

            username.innerText = user.user.username
            username.style.color = user.user.color

            if (user.user.pfp && user.user.pfp !== "undefined") pfp.src = user.user.pfp
            else {
                pfp = document.createElement("div")
                pfp.innerText = user.user.username.split("")[0].toUpperCase()
                pfp.style.backgroundColor = user.user.color
            }

            pfp.classList.add("pfp")
            userDetailsWrapper.append(...[pfp, username])
            userDetailsWrapper.classList.add("online_users")
            allUsersWrapper.appendChild(userDetailsWrapper)
        })
        usersList.innerHTML = ""
        const heading = document.createElement("h4")
        heading.innerText = "Users:"
        allUsersWrapper.style.display = "grid"
        usersList.append(...[heading, allUsersWrapper])
    })
}