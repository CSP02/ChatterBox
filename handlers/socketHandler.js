/**
 * ? Imports
 */
import { GetMessages } from "../ChatterBox/Message.js"

/**
 * ? method to handle all the sockets events
 */
export function HandleSocketEvents(socket) {
    // Send the user details of a newly logged user to everyone who connected to the socket
    socket.on("LOGIN", data => {
        socket.emit("MEMBER_ADD", data.user)
    })

    // Get all messages when someone sent a message
    socket.on("MESSAGES", data => {
        GetMessages(data)
    })

    // This event is when user updates their profile
    socket.on("UPDATE_USERS_LIST", users => {
        const currentUsers = []
        const usersList = document.getElementById("users_list")

        usersList.innerHTML = ""

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
            usersList.appendChild(userDetailsWrapper)
        })
    })

    socket.on("TYPING", usernames => {
        const actionIndicator = document.getElementById("action_indicator")
        const namesInInd = document.createElement("span")

        namesInInd.innerText = [...usernames].join(", ")
        namesInInd.classList.add("typing_usernames")

        actionIndicator.innerHTML = ""
        actionIndicator.appendChild(namesInInd)
        const textNode = document.createTextNode(`${usernames.length === 1 ? " is" : " are"} typing`)
        actionIndicator.appendChild(textNode)

        setTimeout(() => {
            actionIndicator.innerHTML = ""
        }, 15000)
    })
}