/**
 * ? Imports from other scripts
 */
import { AddUserToChannel, CreateChannel, LogoutUser, SendSocketEvent, UpdateUserdetails, SetDefaults, GetMessages, GetChannels, SendMessage, UpdateUser, ScrollToBottom, SendJoinEvent } from "../ChatterBox/Message.js"

SetDefaults({
    token: window.sessionStorage.getItem("token"),
    user: window.sessionStorage.getItem("user"),
    refreshToken: window.sessionStorage.getItem("refresh token"),
    activeChannel: window.sessionStorage.getItem("active_channel")
})

/**
 * ? Defining document elements
 */

const sendMessage = document.getElementById("send_message")
const newMessagePopup = document.getElementById("new_message_popup")
const logout = document.getElementById("logout")
const profile = document.getElementById("profile_pfp")
const updateProfileButton = document.getElementById("update_profile")
const closeUpdateProfile = document.getElementById("close_update_profile")
const showCreateForm = document.getElementById("create_channel")
const createChannelButton = document.getElementById("channel_create_but")
const cancelChannelButton = document.getElementById("cancel")
const formWrapper = document.getElementById("create_channel_form")

/**
 * ? Event listener for profile button which shows the profile details
 * ? Like username, avatar, prefered color and avatar URL 
 */
profile.addEventListener("click", event => {
    const profilePage = document.getElementById("profile_page") // Profile page is the element which shows all the details about user (excluding password because for authentication this app uses JWT)
    profilePage.style.display = "grid"
})

/**
 * ? Event listener for "update" button in profile
 * ? this will update the "User" in the database to the new profile
 */
updateProfileButton.addEventListener("click", (event) => {
    UpdateUser() // Method imported from "./ChatterBox/Message.js"
})

/**
 * ? event listener to close profile window (not really a window it's just an element with fixed position)
 */
closeUpdateProfile.addEventListener("click", (event) => {
    document.getElementById("profile_page").style.display = "none"
})

/**
 * ? Event listener for logout button
 */
logout.addEventListener("click", event => {
    LogoutUser() // Method imported from "./ChatterBox/Message.js"
})

/**
 * ? Event listener for "send" button (at the message box) 
 */
sendMessage.addEventListener("click", event => {
    const messageContent = document.getElementById("message_box")
    if (messageContent.innerText.trim() === "") return
    // Creating a message object which contains content (it is a object because we are going to add JWT token to this object later)
    const message = {
        content: messageContent.innerText.trim()
    }
    SendMessage(message) // Method imported from "./ChatterBox/Message.js"
    messageContent.innerText = "" // Removing the content in #message_box element
})

const messagesDiv = document.getElementById("messages")

messagesDiv.addEventListener("scroll", () => {
    const messagesDiv = document.getElementById("messages")
    const scrollHeight = messagesDiv.scrollHeight
    const scrollTop = messagesDiv.scrollTop
    const offsetHeight = messagesDiv.offsetHeight
    const lastChild = messagesDiv.lastChild

    if (scrollHeight <= scrollTop + offsetHeight + 140) {
        document.getElementById("new_message_popup").style.display = "none";
    }
})
/**
 * ? Event listener for the "new messages" popup
 * ? when clicked we should scroll to end of the #messages element 
 */
newMessagePopup.addEventListener("click", () => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight + messagesDiv.clientHeight
    newMessagePopup.style.display = "none" // removing the popup message 
})

/**
 * ? This event is to disable the send button when there is no content/text in the textbox
 */
const messageBox = document.getElementById("message_box")
messageBox.addEventListener("input", (event) => {
    if (messageBox.innerText.length > 500) {
        messageBox.style.outlineColor = "#ff4d4d"
        // newMessagePopup.innerText = "exceeded 500 characters the remaining characters will be excluded in the message!"
        // newMessagePopup.style.display = "block"
    } else {
        messageBox.style.outlineColor = "rgb(214, 214, 214)"
    }

    const user = JSON.parse(window.sessionStorage.getItem("user"))
    const data = {
        username: user.username,
        channelId: location.pathname.split("/").reverse()[0].toString()
    }
    // setTimeout(() => {
        SendSocketEvent("TYPING", data)
    // }, 3000)
    // removing all spaces at the beginning and at the end of the content in the message box and check if the length is greater than 0
    if (messageBox.innerText.trim().length > 0) {
        sendMessage.removeAttribute("disabled"); // enable button if the length is greater than 0
    } else {
        sendMessage.setAttribute("disabled", true); // disable when the length is 0
        messageBox.innerText = "" // clear message box
    }

    // Making "click enter to send" kind of thingy 
    if (event.inputType === "insertParagraph" || (event.inputType === "insertText" && event.data === null)) {
        event.preventDefault();
        sendMessage.click();
        sendMessage.disabled = true
    }
});

showCreateForm.addEventListener("click", click => {
    formWrapper.style.display = "flex"
})

createChannelButton.addEventListener("click", click => {
    CreateChannel()
    formWrapper.style.display = "none"
})

cancelChannelButton.addEventListener("click", click => {
    formWrapper.style.display = "none"
})

window.onload = () => {
    // const [type, id] = location.search.replace("?", "").split("=")
    const user = JSON.parse(window.sessionStorage.getItem("user"))

    // update the active users list 
    UpdateUserdetails(user);

    SendSocketEvent("LOGIN", user)

    // Get all channels user present in
    GetChannels()

    setTimeout(() => {
        const path = location.pathname
        if (path !== "/@me/") {
            const channel = document.getElementById(path.split("/").reverse()[0].toString())
            const channelId = { _id: path.split("/").reverse()[0].toString() }
            const channelIndicator = document.getElementById("channel_name_indicator")
            if (!channel) location.reload()
            channel.classList.replace("inactive", "active")
            channelIndicator.innerText = channel.innerText
            const previousChannel = window.sessionStorage.getItem("active_channel")

            SendJoinEvent(channelId, previousChannel)

            window.sessionStorage.setItem("active_channel", channelId)

            const invite = document.createElement("button")
            const icon = document.createElement("i")
            icon.classList.add("fas", "fa-user-plus")

            invite.appendChild(icon)
            invite.id = `invite_to_${channel}`
            invite.classList.add("invite")

            invite.addEventListener("click", click => {
                const inviteForm = document.getElementById("invite_form")
                inviteForm.style.display = "flex"

                const inviteButton = document.getElementById("invite_okay")
                inviteButton.addEventListener("click", click => {
                    const username = document.getElementById("Username").value

                    AddUserToChannel(channelId, username)
                    inviteForm.style.display = "none"
                })
                const cancelInvite = document.getElementById("cancel_invite")
                cancelInvite.addEventListener("click", click => {
                    console.log("cancel")
                    inviteForm.style.display = "none"
                })
            })
            channelIndicator.appendChild(invite)

            // Get all messages from the Database
            GetMessages(channelId);
        }
        ScrollToBottom(true)

        document.getElementById("loading").style.display = "none"
    }, 1000)
}

document.getElementById("open_users_list").addEventListener("click", click => {
    const usersList = document.getElementById("list_users")
    if (usersList.classList.contains("opened")) {
        usersList.classList.replace("opened", "closed")
        usersList.style.marginLeft = "-100%"
    }
    else if (usersList.classList.contains("closed")) {
        usersList.classList.replace("closed", "opened")
        usersList.style.marginLeft = ".5rem"
    }
})

document.getElementById("open_channel_button").addEventListener("click", click => {
    const channels = document.getElementById("channels")
    if (channels.classList.contains("opened")) {
        channels.classList.replace("opened", "closed")
        channels.style.marginLeft = "-100%"
    }
    else if (channels.classList.contains("closed")) {
        channels.classList.replace("closed", "opened")
        channels.style.marginLeft = ".5rem"
    }
})