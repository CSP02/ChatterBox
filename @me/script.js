/**
 * ? Imports from other scripts
 */
import { SendSocketEvent, UpdateUserdetails, SetDefaults, GetAllMessages, ScrollToBottom, SendMessage, UpdateUser } from "../ChatterBox/Message.js"
import { HandleSocketEvents } from "../handlers/socketHandler.js"

SetDefaults({ token: window.sessionStorage.getItem("token"), user: window.sessionStorage.getItem("user") })

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

/**
 * ? Scroll event for #messages (element which shows all the messages from database)
 * ? this is because when user scroll up we have to get a notification kind of popup which says the we have new messages 
 * ? But when the user is at the bottom of the messages (means they are at end of conversation) it should auto scroll when a new message occurs
 */
messagesDiv.addEventListener("scroll", event => {
    // Getting the scroll pos which says if scroll position is at the end of the #messages element or not
    const scrollPos = Math.abs(messagesDiv.scrollHeight - messagesDiv.clientHeight - messagesDiv.scrollTop)
    if (scrollPos <= 0) { // If the scroll position is at the end of the #messages we are scrolling to the end (just making sure) and removing the popup
        messagesDiv.scrollTop = messagesDiv.scrollHeight + messagesDiv.clientHeight
        newMessagePopup.style.display = "none"
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
    //scroll to the bottom of the messages
    ScrollToBottom(true);
}

document.getElementById("open_users_list").addEventListener("click", click => {
    const toggler = new Toggler

    toggler.toggleSlide("users_list", "right", .6)
    toggler.toggleClass("open_users_list", "inactive", "active")
})
