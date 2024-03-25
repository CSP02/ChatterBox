/**
 * ? Imports from other scripts
 */
import { SendSocketEvent, UpdateUserdetails, SetDefaults, GetAllMessages, SendMessage, UpdateUser, ScrollToBottom } from "../ChatterBox/Message.js"
import { HandleSocketEvents } from "../handlers/socketHandler.js"

SetDefaults({
    token: window.sessionStorage.getItem("token"),
    user: window.sessionStorage.getItem("user"),
    refreshToken: window.sessionStorage.getItem("refresh token")
})

/**
 * ? Handle the socket events like "MESSAGES", "LOGIN", etc.
 */
HandleSocketEvents()

/**
 * ? Defining document elements
 */

const sendMessage = document.getElementById("send_message")
const newMessagePopup = document.getElementById("new_message_popup")
const logout = document.getElementById("logout")
const profile = document.getElementById("profile_pfp")
const updateProfileButton = document.getElementById("update_profile")
const closeUpdateProfile = document.getElementById("close_update_profile")

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
        messageBox.style.border = "1px solid red"
        // newMessagePopup.innerText = "exceeded 500 characters the remaining characters will be excluded in the message!"
        // newMessagePopup.style.display = "block"
    } else {
        messageBox.style.border = "none"
        // newMessagePopup.innerText = "New messages!"
        // newMessagePopup.style.display = "none"
    }
    // SendTypingEvent()
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

window.onload = () => {
    document.getElementById("loading").style.display = "none"
    const user = JSON.parse(window.sessionStorage.getItem("user"))
    // update the active users list 
    UpdateUserdetails(user);
    SendSocketEvent("LOGIN", user)

    // Get all messages from the Database
    GetAllMessages();
    ScrollToBottom(true)
}

document.getElementById("open_users_list").addEventListener("click", click => {
    const toggler = new Toggler

    toggler.toggleSlide("users_list", "right", .6)
    toggler.toggleClass("open_users_list", "inactive", "active")
})
