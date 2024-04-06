import ComponentTypes from "./types.js"
import { HandleSocketEvents } from "../handlers/socketHandler.js";

let socket = io()
const messagesHolder = document.getElementById("messages");
let loggedUser = null;
let token = null;
let refreshToken = null
const apiURL = "http://localhost:3001"
let activeChannel = { name: "http://localhost:3000/@me" }
const types = new ComponentTypes()

HandleSocketEvents(socket)

export function SetDefaults(defaults) {
    token = defaults.token
    loggedUser = JSON.parse(defaults.user)
    refreshToken = defaults.refreshToken
    activeChannel = defaults.activeChannel
}

export function SendSocketEvent(event, data) {
    socket.emit(event, data);
}

const previousMessage = {
    username: "",
    timestamp: ""
}
function AddToMessages(message) {
    const messageHolder = document.createElement("div");
    const usernameHolder = document.createElement("p");
    const timeStampHolder = document.createElement("i");
    const pfp = new Image()
    const messAndUserholder = document.createElement("div");
    const contentHolder = document.createElement("p");

    const username = message.user.username;
    const color = message.user.color;
    const content = message.content;
    const avatarURL = message.user.avatarURL;
    const date = new Date(message.timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    let AmOrPm = "AM";

    const hours = () => {
        if (date.getHours() > 12) {
            const hrs12Format = parseInt(date.getHours(), 10) - 12;
            AmOrPm = "PM";
            return hrs12Format;
        } else {
            return date.getHours();
        }
    };
    const minutes =
        date.getMinutes().toString().length === 1
            ? `0${date.getMinutes()}`
            : date.getMinutes().toString();

    const timeStamp =
        day +
        "/" +
        month +
        "/" +
        year +
        " at " +
        hours() +
        ":" +
        minutes +
        " " +
        AmOrPm;

    const usernameButton = document.createElement("button")
    usernameButton.innerText = username + " "
    usernameHolder.appendChild(usernameButton)
    timeStampHolder.innerText = timeStamp;
    timeStampHolder.classList.add("timestamp")

    usernameHolder.appendChild(timeStampHolder);
    usernameButton.style.color = color;

    pfp.src = avatarURL;
    pfp.height = "50px";
    pfp.width = "50px";
    pfp.classList.add("pfp");
    usernameButton.classList.add("chat_username");
    usernameButton.style.backgroundColor = "transparent"
    usernameButton.style.border = "none"

    usernameButton.addEventListener("click", event => {
        const messageBox = document.getElementById("message_box")
        messageBox.innerText += `@${usernameButton.innerText}`
        messageBox.focus()
    })

    contentHolder.classList.add("message_db");
    ResolveContent(content, contentHolder, message);
    messageHolder.classList.add("message_holder");

    messAndUserholder.classList.add("message_user_holder")

    if (previousMessage.username !== "" && previousMessage.timestamp !== "") {
        if (previousMessage.username === username && new Date(message.timestamp) - new Date(previousMessage.timestamp) <= 60000 && messagesHolder.children.length > 0) {
            const prevMessHolder = messagesHolder.lastChild.lastChild

            prevMessHolder.appendChild(contentHolder)
            previousMessage.username = username;
            previousMessage.timestamp = new Date(message.timestamp)
            return
        } else {
            messAndUserholder.append(...[usernameHolder, contentHolder]);
            messageHolder.append(...[pfp, messAndUserholder]);
        }
    } else {
        messAndUserholder.append(...[usernameHolder, contentHolder]);
        messageHolder.append(...[pfp, messAndUserholder]);
    }
    previousMessage.username = username;
    previousMessage.timestamp = new Date(message.timestamp)


    messagesHolder.appendChild(messageHolder);
}

export function SendJoinEvent(channel, activeChannel){
    socket.emit("JOIN_CHANNEL", { channel: channel, user: loggedUser })
    activeChannel = channel
}

function AddToChannels(channels) {
    const channelsWrapper = document.getElementById("channels")

    channels.forEach(channel => {
        const channelName = channel.name
        const iconURL = channel.iconURL

        const nameButton = document.createElement("button")
        nameButton.id = channelName
        nameButton.innerText = channelName
        nameButton.classList.add("inactive")
        nameButton.classList.add("channel")
        nameButton.classList.add(channel._id)

        nameButton.addEventListener("click", click => {
            socket.emit("LEAVE_CHANNEL", { channel: activeChannel, user: loggedUser })
            window.sessionStorage.setItem("active_channel", activeChannel)

            location = "http://localhost:3000/@me/" + channel._id

        })

        channelsWrapper.appendChild(nameButton)
    })
}

export function AddUserToChannel(channelId, username) {
    console.log(channelId)
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)

    fetch(
        `${apiURL}/api/add_user?channel_id=${channelId._id}&username=${username}`,
        {
            mode: "cors",
            headers: headers
        },
    )
        .then(async (response) => {
            if (response.status === 401) {
                const headers = new Headers()

                headers.append("Authorization", `Bearer ${refreshToken}`)
                fetch(`${apiURL}/api/request_new_token`, {
                    mode: "cors",
                    headers: headers
                }).then(async response => {
                    if (response.ok) return await response.json()
                }).then(response => {
                    token = response.token
                    refreshToken = response.refreshToken

                    AddUserToChannel(channelId, username)
                })
            }
            if (response.ok) return await response.json();
        })
        .then((response) => {
            socket.emit("USER_INVITE", username)
        });
}

export async function GetAllMessages(activeChannel) {
    previousMessage.username = ""
    previousMessage.timestamp = ""
    const messagesDiv = document.getElementById("messages");
    const headers = new Headers()

    headers.append("Authorization", `Bearer ${token}`)
    fetch(
        `${apiURL}/api/get_messages?channel_id=${activeChannel._id}`,
        {
            mode: "cors",
            headers: headers
        },
    )
        .then((response) => {
            if (response.status === 401) {
                const headers = new Headers()

                headers.append("Authorization", `Bearer ${refreshToken}`)
                fetch(`${apiURL}/api/request_new_token`, {
                    mode: "cors",
                    headers: headers
                }).then(async response => {
                    if (response.ok) return await response.json()
                }).then(response => {
                    token = response.token
                    refreshToken = response.refreshToken

                    GetAllMessages(activeChannel)
                })
            }
            if (response.ok) return response.json();
        })
        .then(async (response) => {
            const isEmpty = await response.EmptyChat;
            const messages = await response.messages;

            if (await isEmpty) return messagesDiv.classList.add("empty_messages");
            messagesDiv.classList.remove("empty_messages")
            messagesDiv.innerHTML = "";
            messages.forEach((message) => {
                AddToMessages(message);
            });
            ScrollToBottom(false);
        });
}

export async function GetChannels() {
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)

    fetch(`${apiURL}/api/channels`, {
        mode: "cors",
        headers: headers
    }).then((response) => {
        if (response.status === 401) {
            const headers = new Headers()

            headers.append("Authorization", `Bearer ${refreshToken}`)
            fetch(`${apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json()
            }).then(response => {
                token = response.token
                refreshToken = response.refreshToken

                GetChannels()
            })
        }
        if (response.ok) return response.json();
    })
        .then(async (response) => {
            if (response.channels.length <= 0) return
            const channels = await response.channels

            AddToChannels(channels)
            window.sessionStorage.setItem("channels", JSON.stringify(channels))
        });
}

export async function CreateChannel() {
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)

    const channelName = document.getElementById("channel_name").value
    const body = {
        channelName: channelName
    }

    fetch(`${apiURL}/api/channels`, {
        mode: "cors",
        headers: headers,
        method: "POST",
        body: new Blob([JSON.stringify(body)], { type: "application/json" })
    }).then((response) => {
        if (response.status === 401) {
            const headers = new Headers()

            headers.append("Authorization", `Bearer ${refreshToken}`)
            fetch(`${apiURL}/api/channels`, {
                mode: "cors",
                headers: headers,
                method: "POST",
                body: new Blob([JSON.stringify(body)], { type: "application/json" })
            }).then(async response => {
                if (response.ok) return await response.json()
            }).then(response => {
                token = response.token
                refreshToken = response.refreshToken

                CreateChannel()
            })
        }
        if (response.ok) return response.json();
    })
        .then(async (response) => {
            if (!response.channel) return

            AddToChannels([response.channel])
        });
}

export async function SendMessage(message) {
    previousMessage.username = ""
    previousMessage.timestamp = ""
    const path = location.pathname
    const channelId = path.split("/").reverse()[0].toString()
    
    message.reqType = "SEND_MESSAGE";
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)
    fetch(
        `${apiURL}/api/send_message?channel_id=${channelId}`,
        {
            method: "POST",
            mode: "cors",
            body: new Blob([JSON.stringify(message)], {
                type: "application/json",
            }),
            headers: headers
        },
    )
        .then((response) => {
            if (response.status === 401) {
                const headers = new Headers()

                headers.append("Authorization", `Bearer ${refreshToken}`)
                fetch(`${apiURL}/api/request_new_token`, {
                    mode: "cors",
                    headers: headers
                }).then(async response => {
                    if (response.ok) return await response.json()
                }).then(response => {
                    token = response.token
                    refreshToken = response.refreshToken

                    SendMessage(message)
                })
            }
            if (response.ok) return response.json();
        })
        .then(async (response) => {
            socket.emit("MESSAGES", channelId);
        });
}

export async function UpdateUser() {
    const updateUsername = document.getElementById("profile_username");
    const updateColor = document.getElementById("profile_color");
    const updateAvatarURL = document.getElementById("profile_avatar_url");
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)
    const updateUser = {
        username: updateUsername.value,
        color: updateColor.value,
        avatarURL: updateAvatarURL.value,
    };

    fetch(`${apiURL}/api/profile`, {
        method: "PUT",
        mode: "cors",
        body: new Blob([JSON.stringify(updateUser)], {
            type: "application/json",
        }),
        headers: headers
    },
    )
        .then(async (response) => {
            if (response.status === 401) {
                const headers = new Headers()

                headers.append("Authorization", `Bearer ${refreshToken}`)
                fetch(`${apiURL}/api/request_new_token`, {
                    mode: "cors",
                    headers: headers
                }).then(async response => {
                    if (response.ok) return await response.json()
                }).then(response => {
                    token = response.token
                    refreshToken = response.refreshToken

                    UpdateUser()
                })
            }
            if (response.ok) return await response.json();
        })
        .then((response) => {
            if (!response.success) return alert("unable to update the profile");

            const updatedUsername = response.updatedUser.username;
            const updatedColor = response.updatedUser.color;
            const updatedAvatarURL = response.updatedUser.avatarURL;

            const avatar = document.getElementById("avatar");
            avatar.src = updatedAvatarURL;
            updateUsername.value = updatedUsername;
            updateColor.value = updatedColor;
            updateAvatarURL.value = updatedAvatarURL;

            document.getElementById("reload").style.display = "grid";
        });
}

export function SendTypingEvent() {
    socket.emit("TYPING", "Someone is typing!");
}

async function ResolveContent(content, contentHolder, message) {
    let finalText = content.split(" ");

    content.split(" ").forEach((data) => {
        if (data.startsWith("https://") || data.startsWith("http://")) {
            const link = document.createElement("a")
            const text = document.createTextNode(data + " ")
            link.href = data;
            link.append(text)

            finalText[finalText.indexOf(data)] = link;
        }

        if (data === `@${loggedUser.username}`) {
            const mentionWrapper = document.createElement("span")
            const mention = document.createElement("b");
            const text = document.createTextNode(" ");

            mention.innerText = data

            mentionWrapper.append(...[mention, text])
            mentionWrapper.style.display = "flex"
            finalText[finalText.indexOf(data)] = mentionWrapper;
            setTimeout(() => {
                const messageHolder = contentHolder.parentElement.parentElement
                messageHolder.classList.add("mentioned");
                messageHolder.style.backgroundColor = loggedUser.color + "11"
                messageHolder.style.borderTop = "solid " + loggedUser.color
                messageHolder.style.borderBottom = "solid " + loggedUser.color
            }, 100);
        }

        /**
         * TODO: Add markdown
         */

        if (!(data.includes("https://") || data.includes("http://")) && data !== `@${loggedUser.username}`) {
            const text = document.createTextNode(data + "\ ");
            finalText[finalText.indexOf(data)] = text;
        }
    });
    const components = []
    if (message.components.length > 0)
        [...message.components].forEach(component => {
            const embedWrapper = document.createElement("div")
            embedWrapper.classList.add("embed")

            const title = document.createElement("h3")
            const description = document.createElement("p")
            const image = new Image()

            if (component.type === types.ComponentTypes.EMBED) {
                if (!component.title && !component.description && !component.image) { }
                else {
                    title.classList.add("embed_title")
                    const titleLink = document.createElement("a")
                    titleLink.href = component.url
                    titleLink.innerText = component.title
                    title.appendChild(titleLink)

                    description.classList.add("embed_description")
                    description.innerText = component.description ? component.description : ""

                    if (component.image) {
                        image.classList.add("embed_image")
                        image.src = component.image
                        embedWrapper.append(...[title, description, image])
                    } else {
                        embedWrapper.append(...[title, description])
                    }
                    components.push(embedWrapper)
                }
            }

            if (component.type === types.ComponentTypes.IMAGE) {
                const image = new Image
                image.src = component.imageURL

                image.classList.add("component_image")
                components.push(image)
            }
        })

    contentHolder.append(...finalText);
    setTimeout(() => {
        contentHolder.parentElement.append(...components)
    }, 100)
}

export function ScrollToBottom(onload) {
    const messagesDiv = document.getElementById("messages")
    const scrollHeight = messagesDiv.scrollHeight
    const scrollTop = messagesDiv.scrollTop
    const offsetHeight = messagesDiv.offsetHeight
    const lastChild = messagesDiv.lastChild

    if (scrollHeight <= scrollTop + offsetHeight + 140) {
        messagesDiv.scrollTo(0, scrollHeight + lastChild.offsetHeight)
        document.getElementById("new_message_popup").style.display = "none";
    } else {
        if (scrollHeight >= messagesDiv.clientHeight)
            document.getElementById("new_message_popup").style.display = "block";
    }
}

export function LogoutUser() {
    token = null;
    refreshToken = null;
    loggedUser = null

    window.sessionStorage.setItem("token", token)
    window.sessionStorage.setItem("refresh token", refreshToken)
    window.sessionStorage.setItem("user", loggedUser)

    location = "/"
}

export function UpdateUserdetails(user) {
    const profilePfp = document.getElementById("profile_pfp");
    const colorInNav = document.getElementById("profile_color");

    const profilePagePfp = document.getElementById("avatar");
    const profilePageUsername = document.getElementById("profile_username");
    const profilePageColor = document.getElementById("profile_color");
    const profilePageAvatarURL = document.getElementById("profile_avatar_url");

    const updatedUsername = user.username;
    const updatedColor = user.color;
    const updatedPfp = user.avatarURL;

    const image = new Image()
    image.src = updatedPfp
    profilePfp.appendChild(image)

    colorInNav.value = updatedColor;

    profilePagePfp.src = updatedPfp;
    profilePageUsername.value = updatedUsername;
    profilePageColor.value = updatedColor;
    profilePageAvatarURL.value = updatedPfp;
}