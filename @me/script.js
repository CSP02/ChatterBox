/**
 * ? Imports from other scripts
 */
import { LogoutUser, SendSocketEvent, SetDefaults, ScrollToBottom, SendJoinEvent } from "../ChatterBox/Utility.js";
import { SendMessage, GetMessages } from "../ChatterBox/Message.js";
import ComponentTypes from "../ChatterBox/types.js";
import { HandleSocketEvents } from "../handlers/socketHandler.js";
import { UpdateUser, UpdateUserdetails, AddUserToChannel, SearchUser } from "../ChatterBox/User.js";
import { GetChannels, CreateChannel, UpdateChannel } from "../ChatterBox/Channel.js";
import HandleErrors from "../handlers/errorHandler.js";

let socket = io();
const messagesHolder = document.getElementById("messages");
let loggedUser = JSON.parse(window.sessionStorage.getItem("user"));
let token = window.sessionStorage.getItem("token");
let refreshToken = window.sessionStorage.getItem("refresh token");
const apiURL = "http://localhost:3001/api";
let activeChannel = { name: "http://localhost:3000/@me" };
const types = new ComponentTypes();
const repliedToCache = { isEmpty: true };
const previousMessage = {
    username: "",
    timestamp: ""
};
let params;

function SetParams(params) {
    params = {
        socket: socket,
        messagesHolder: messagesHolder,
        logggedUser: loggedUser,
        token: token,
        refreshToken: refreshToken,
        apiURL: apiURL,
        activeChannel: activeChannel,
        types: types,
        repliedToCache: repliedToCache,
        previousMessage: previousMessage
    };
    return params;
}

HandleSocketEvents(socket, SetParams(params))

SetDefaults({
    token: window.sessionStorage.getItem("token"),
    user: window.sessionStorage.getItem("user"),
    refreshToken: window.sessionStorage.getItem("refresh token"),
    activeChannel: window.sessionStorage.getItem("active_channel")
}, socket);

/**
 * ? Defining document elements
 */

const sendMessage = document.getElementById("send_message");
const newMessagePopup = document.getElementById("new_message_popup");
const logout = document.getElementById("logout");
const profile = document.getElementById("profile_pfp");
const updateProfileButton = document.getElementById("update_profile");
const closeUpdateProfile = document.getElementById("close_update_profile");
const updateChannelButton = document.getElementById("update_channel");
const closeUpdateChannel = document.getElementById("close_update_channel");
const showCreateForm = document.getElementById("create_channel");
const createChannelButton = document.getElementById("channel_create_but");
const cancelChannelButton = document.getElementById("cancel");
const formWrapper = document.getElementById("create_channel_form");
const emojisButton = document.getElementById("emojis_button");
const emojisHolder = document.getElementById("emojis_holder");

/**
 * ? Event listener for profile button which shows the profile details
 * ? Like username, avatar, prefered color and avatar URL 
 */
profile.addEventListener("click", event => {
    const profilePage = document.getElementById("profile_page"); // Profile page is the element which shows all the details about user (excluding password because for authentication this app uses JWT)
    profilePage.style.display = "grid";
})

/**
 * ? Event listener for "update" button in profile
 * ? this will update the "User" in the database to the new profile
 */
updateProfileButton.addEventListener("click", (event) => {
    UpdateUser(SetParams(params)); // Method imported from "./ChatterBox/Message.js"
})

/**
 * ? event listener to close profile window (not really a window it's just an element with fixed position)
 */
closeUpdateProfile.addEventListener("click", (event) => {
    document.getElementById("profile_page").style.display = "none";
})

/**
 * ? Event listener for "update" button in profile
 * ? this will update the "Channel" in the database
 */
updateChannelButton.addEventListener("click", (event) => {
    UpdateChannel(SetParams(params)); // Method imported from "./ChatterBox/Channel.js"
})

/**
 * ? event listener to close channel settings window (not really a window it's just an element with fixed position)
 */
closeUpdateChannel.addEventListener("click", (event) => {
    document.getElementById("channel_settings_win").style.display = "none";
})

/**
 * ? Event listener for logout button
 */
logout.addEventListener("click", event => {
    LogoutUser(); // Method imported from "./ChatterBox/Message.js"
})

const fileUploadButton = document.getElementById("file_button");
const fileUploadInp = document.getElementById("file_upload");
/**
 * ? Event listener for "send" button (at the message box) 
 */
sendMessage.addEventListener("click", event => {
    const messageContent = document.getElementById("message_box");
    if (messageContent.innerText.trim() === "" && !fileUploadInp.files[0]) return;
    // Creating a message object which contains content (it is a object because we are going to add JWT token to this object later)
    if (messageContent.innerText.trim().split(" ").length <= 1) {

    }
    const message = {
        user: JSON.parse(window.sessionStorage.getItem("user")),
        content: messageContent.innerText.trim(),
        channel: JSON.parse(window.sessionStorage.getItem("active_channel")),
    };
    if (window.sessionStorage.getItem("repliedTo") !== "")
        message.repliedTo = window.sessionStorage.getItem("repliedTo");
    SendMessage(message, SetParams(params)); // Method imported from "./ChatterBox/Message.js"
    messageContent.innerText = "" // Removing the content in #message_box element
    document.getElementById("file_indicator").classList.remove("show_ind");
    fileUploadInp.value = "";
});

fileUploadButton.addEventListener("click", e => {
    fileUploadInp.click();
})

fileUploadInp.addEventListener("change", e => {
    sendMessage.removeAttribute("disabled");

    const file = fileUploadInp.files[0];
    const removeFile = document.createElement("button");
    const cancelIcon = document.createElement("i");
    const fileHolder = document.createElement("div");
    fileHolder.classList.add("file_holder");
    cancelIcon.classList.add(...["fa-solid", "fa-xmark"]);
    removeFile.appendChild(cancelIcon);
    removeFile.classList.add("remove_file_button");
    removeFile.addEventListener("click", e => {
        fileUploadInp.value = "";
        document.getElementById("file_indicator").innerHTML = "";
        document.getElementById("file_indicator").classList.remove("show_ind");
    })
    console.log(fileUploadInp.files[0])
    const reader = new FileReader();
    if (file.type.includes("image")) {
        const img = new Image();
        reader.onload = (ev) => {
            img.src = ev.target.result;
        }
        reader.readAsDataURL(file);
        fileHolder.append(...[img, removeFile])
    }else if(file.type === "text/plain"){
        const linkFileHolder = document.createElement("div");
        const fileIcon = document.createElement("i");
        fileIcon.classList.add(...["fa-solid", "fa-file-lines"]);
        const fileName = file.name;
        const nameHolder = document.createElement("p");
        nameHolder.innerText = fileName;
        linkFileHolder.append(...[fileIcon, nameHolder]);
        linkFileHolder.classList.add("file_link_holder");
        fileHolder.append(...[linkFileHolder, removeFile]);
    }
    document.getElementById("file_indicator").appendChild(fileHolder);
    document.getElementById("file_indicator").classList.add("show_ind");
})

const messagesDiv = document.getElementById("messages");

messagesDiv.addEventListener("scroll", () => {
    const messagesDiv = document.getElementById("messages");
    const scrollHeight = messagesDiv.scrollHeight;
    const scrollTop = messagesDiv.scrollTop;
    const offsetHeight = messagesDiv.offsetHeight;
    const lastChild = messagesDiv.lastChild;

    if (scrollHeight <= scrollTop + offsetHeight + 140) {
        document.getElementById("new_message_popup").style.display = "none";
    }
})
/**
 * ? Event listener for the "new messages" popup
 * ? when clicked we should scroll to end of the #messages element 
 */
newMessagePopup.addEventListener("click", () => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight + messagesDiv.clientHeight;
    newMessagePopup.style.display = "none"; // removing the popup message 
})


emojisButton.addEventListener("click", e => {
    emojisHolder.classList.toggle("emojis_open");
});

document.getElementById("emojis_click").addEventListener("click", e => {
    const emojiDup = document.createTextNode(":kekw: ");
    messageBox.append(emojiDup);
})

window.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const selection = window.getSelection().toString();
        const text = selection.replace(/<[^>]*>/g, '');

        navigator.clipboard.writeText(text);
    }
})

/**
 * ? This event is to disable the send button when there is no content/text in the textbox
 */
const messageBox = document.getElementById("message_box");

const handleEvent = event => {
    const user = JSON.parse(window.sessionStorage.getItem("user"));
    const data = {
        username: user.username,
        channelId: location.pathname.split("/").reverse()[0].toString()
    };
    SendSocketEvent("TYPING", data);
    // removing all spaces at the beginning and at the end of the content in the message box and check if the length is greater than 0
    if (messageBox.innerText.trim().length > 0) {
        sendMessage.removeAttribute("disabled"); // enable button if the length is greater than 0
    } else {
        sendMessage.setAttribute("disabled", true); // disable when the length is 0
        messageBox.innerText = ""; // clear message box
    }
}
let isLineBreak = false;

messageBox.addEventListener("input", event => {
    if (messageBox.innerText.length > 500) messageBox.style.outlineColor = "#ff4d4d";
    else messageBox.style.outlineColor = "rgb(214, 214, 214)";

    if (messageBox.innerText.trim() !== "") sendMessage.removeAttribute("disabled");
    else if (!messageBox.innerText || messageBox.innerText.trim() === "") sendMessage.setAttribute("disabled", true);

    // Making "click enter to send" kind of thingy 
    // if (event.inputType === "insertLineBreak") messageBox.innerText += "\n"
    if (event.inputType === "insertParagraph" || (event.inputType === "insertText" && event.data === null) && !isLineBreak) {
        event.preventDefault();
        sendMessage.click();
        sendMessage.disabled = true;
    }
})

messageBox.addEventListener("drop", e => {
    e.preventDefault();
    messageBox.textContent = window.getSelection().toString().replaceAll(/<[^>]*>/g, "");
})

messageBox.addEventListener("keydown", key => {
    if (key.shiftKey) isLineBreak = true;
    else isLineBreak = false;
})

messageBox.addEventListener("input", handleEvent);

export function removeEvent() {
    messageBox.removeEventListener("input", handleEvent);
    setTimeout(() => {
        messageBox.addEventListener("input", handleEvent);
    }, 10000);
}

showCreateForm.addEventListener("click", click => {
    formWrapper.style.display = "flex";
})

createChannelButton.addEventListener("click", click => {
    CreateChannel(SetParams(params));
    formWrapper.style.display = "none";
})

cancelChannelButton.addEventListener("click", click => {
    formWrapper.style.display = "none";
})

const gifButton = document.getElementById("gif_button");
gifButton.addEventListener("click", e => {
    const gifsHolder = document.getElementById("gif_results");
    gifsHolder.classList.toggle("show_gif_holder");
})

const searchGifButton = document.getElementById("search_gif");
const searchResults = document.getElementById("search_results_holder");

searchGifButton.addEventListener("click", e => {
    let limit = 5;
    let pos = 1;
    const searchQuery = document.getElementById("gif_query").value;
    searchResults.innerHTML = "";
    getGifs(`/gif?q=${searchQuery}&limit=${limit}&pos=${pos}`, limit, searchQuery);
})

function getGifs(url, limit, query) {
    fetch(url).then(async response => {
        if (response.ok) return response.json();
    }).then(response => {
        const gifs = response.results;
        const pos = response.next;
        gifs.forEach(gif => {
            const img = new Image();
            img.src = gif;
            img.classList.add("gif_image");

            img.addEventListener("click", e => {
                const url = img.src;

                messageBox.innerText = url;
                if (location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] !== "@me") {
                    sendMessage.removeAttribute("disabled");
                    sendMessage.click();
                }
            })
            searchResults.appendChild(img);
        })
        const loadMoreButton = document.createElement("button");
        loadMoreButton.id = "load_more_gifs";
        loadMoreButton.innerText = "Load more...";
        loadMoreButton.addEventListener("click", e => {
            loadMoreButton.remove();
            const url = `/gif?q=${query}&limit=${limit}&pos=${pos}`;
            getGifs(url, limit, pos);
        })
        searchResults.appendChild(loadMoreButton);
    })
}

const searchUser = document.getElementById("search_user");
searchUser.addEventListener("click", e => {
    const username = document.getElementById("Username").value;
    SearchUser(username, SetParams(params));
})

window.onload = () => {
    const user = JSON.parse(window.sessionStorage.getItem("user"));
    const inviteButton = document.getElementById("invite_okay");

    if (!document.getElementById("Username").value) inviteButton.setAttribute("disabled", true);

    // update the active users list 
    UpdateUserdetails(user);
    SendSocketEvent("LOGIN", user);
    // Get all channels user present in
    GetChannels(SetParams(params));

    setTimeout(() => {
        const path = location.pathname;
        if (path !== "/@me/") {
            const channel = document.getElementById(path.split("/").reverse()[0].toString());
            const channelId = { _id: path.split("/").reverse()[0].toString() };
            const channelIndicator = document.getElementById("channel_details");

            if (!channel) return HandleErrors("INVALID_CHANNEL");
            channel.classList.replace("inactive", "active");
            channelIndicator.innerText = channel.title;
            const previousChannel = window.sessionStorage.getItem("active_channel");
            SendJoinEvent(channelId, previousChannel);

            const channelIcon = document.getElementById("channel_icon_update");
            const newChnlName = document.getElementById("new_channel_name");
            const chnlSettingsButton = document.getElementById("channel_settings");
            chnlSettingsButton.addEventListener("click", async click => {
                const chnlSetWin = document.getElementById("channel_settings_win");
                channelIcon.src = channel.getElementsByTagName("img")[0].src;
                newChnlName.value = channel.title;
                chnlSetWin.style.display = "flex";
            })
            const invite = document.createElement("button");
            const icon = document.createElement("i");
            icon.classList.add("fas", "fa-user-plus");

            invite.appendChild(icon);
            invite.id = `invite_to_${channel}`;
            invite.classList.add("invite");

            invite.addEventListener("click", click => {
                const inviteForm = document.getElementById("invite_form");
                inviteForm.style.display = "flex";

                inviteButton.addEventListener("click", click => {
                    if (document.getElementById("user_selection").checked) {
                        const username = document.getElementById("user_selection").previousSibling.innerText;
                        AddUserToChannel(channelId, username, SetParams(params));
                    }
                    inviteForm.style.display = "none";
                })
                const cancelInvite = document.getElementById("cancel_invite");
                cancelInvite.addEventListener("click", click => {
                    inviteForm.style.display = "none";
                })
            })
            channelIndicator.appendChild(invite);

            // Get all messages from the Database
            GetMessages(channelId, SetParams(params));
            messageBox.setAttribute("contenteditable", true);
            messageBox.style.boxShadow = "black 0 0 5px";
            messageBox.focus();
        } else {
            messageBox.setAttribute("contenteditable", false);
            messageBox.style = "";
        }
        ScrollToBottom(true);

        document.getElementById("loading").style.display = "none";
        if (path.replaceAll("/", "").endsWith("@me"))
            document.getElementById("messages_loading").style.display = "none";
    }, 1000);
}

document.getElementById("open_users_list").addEventListener("click", click => {
    const usersList = document.getElementById("list_users");
    if (usersList.classList.contains("opened")) {
        usersList.classList.replace("opened", "closed");
        usersList.style.marginLeft = "-100%";
    }
    else if (usersList.classList.contains("closed")) {
        usersList.classList.replace("closed", "opened");
        usersList.style.marginLeft = ".5rem";
    }
})

document.getElementById("open_channel_button").addEventListener("click", click => {
    const channels = document.getElementById("channels");
    if (channels.classList.contains("opened")) {
        channels.classList.replace("opened", "closed");
        channels.style.marginLeft = "-100%";
    }
    else if (channels.classList.contains("closed")) {
        channels.classList.replace("closed", "opened");
        channels.style.marginLeft = ".5rem";
    }
})