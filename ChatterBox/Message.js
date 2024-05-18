import ComponentTypes from "./types.js"
import { HandleSocketEvents } from "../handlers/socketHandler.js";
import { removeEvent } from "../@me/script.js";

let socket = io()
const messagesHolder = document.getElementById("messages");
let loggedUser = null;
let token = null;
let refreshToken = null
const apiURL = "http://localhost:3001"
let activeChannel = { name: "http://localhost:3000/@me" }
const types = new ComponentTypes()
const repliedToCache = { isEmpty: true }

HandleSocketEvents(socket)

export function SetDefaults(defaults) {
    token = defaults.token
    loggedUser = JSON.parse(defaults.user)
    refreshToken = defaults.refreshToken
    activeChannel = JSON.parse(defaults.activeChannel)
}

export function SendSocketEvent(event, data) {
    if (event === "TYPING") {
        const headers = new Headers()
        const channel = JSON.parse(window.sessionStorage.getItem("active_channel"))

        headers.append("Authorization", `Bearer ${token}`)
        fetch(`${apiURL}/api/typing?channel_id=${channel._id}`, {
            mode: "cors",
            headers: headers
        }).then(async response => {
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

                    SendSocketEvent(event, data)
                })
            }
            return response.json()
        }).then(response => {
            if (response.success) {
                socket.emit(event, data)
                removeEvent()
            }
        })
    } else if (event !== "TYPING")
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
    const repliedTo = message.repliedTo
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
    if (repliedTo !== undefined && repliedTo.username !== "") {
        const replyIndicator = document.createElement("div")
        const userPfp = document.createElement("img")
        const username = document.createElement("span")
        const content = document.createElement("span")

        username.innerText = repliedTo.username
        content.innerText = repliedTo.content
        content.classList.add("reply_content")
        userPfp.src = repliedTo.avatarURL
        userPfp.style = "height:25px;width:25px;border-radius:50%;"

        username.style.color = repliedTo.color

        replyIndicator.append(...[userPfp, username, content])
        replyIndicator.classList.add("replied_to")
        messAndUserholder.appendChild(replyIndicator)

        pfp.style.marginTop = "calc(25px + 1.2rem)"
    }
    ResolveContent(content, contentHolder, message);
    const reply = document.createElement("button")
    const icon = document.createElement("i")
    icon.classList.add("fa-solid")
    icon.classList.add('fa-reply')
    reply.classList.add("reply_icon")
    reply.append(icon)

    reply.addEventListener("click", click => {
        const content = reply.parentElement.innerText
        let user = reply.parentElement.parentElement.firstChild.firstChild.innerText

        if (user === "") user = reply.parentElement.parentElement.firstChild.nextSibling.firstChild.innerText
        repliedToCache.username = user
        repliedToCache.content = content


        window.sessionStorage.setItem("repliedTo", JSON.stringify(repliedToCache))

        const replyEl = document.createElement("div")
        const username = document.createElement("span")
        const cancelButton = document.createElement("button")
        const closeIcon = document.createElement("i")

        const replyIndicator = document.getElementById("reply_indicator")

        closeIcon.classList.add("fa-solid")
        closeIcon.classList.add("fa-circle-xmark")
        cancelButton.appendChild(closeIcon)
        cancelButton.classList.add("cancel_reply")

        username.innerText = "replying to " + JSON.parse(window.sessionStorage.getItem("repliedTo")).username
        console.log(window.sessionStorage.getItem("repliedTo"))
        cancelButton.addEventListener("click", click => {
            window.sessionStorage.setItem("repliedTo", "")
            replyEl.remove()
            replyIndicator.style.display = "none"
            document.getElementById("message_box").focus()
        })
        replyEl.append(...[username, cancelButton])

        replyIndicator.style.display = "flex"
        replyIndicator.innerHTML = ""
        replyIndicator.appendChild(replyEl)

        document.getElementById("message_box").focus()
    })

    contentHolder.append(reply)
    messageHolder.classList.add("message_holder");

    messAndUserholder.classList.add("message_user_holder")

    if (previousMessage.username !== "" && previousMessage.timestamp !== "" && !message.repliedTo) {
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

export function SendJoinEvent(channel, activeChannel) {
    socket.emit("JOIN_CHANNEL", { channel: channel, user: loggedUser })
    activeChannel = channel
}

function AddToChannels(channels) {
    const channelsWrapper = document.getElementById("channels")

    channels.forEach(channel => {
        const channelName = channel.name
        const iconURL = channel.iconURL

        const nameButton = document.createElement("button")
        nameButton.innerText = channelName
        nameButton.classList.add("inactive")
        nameButton.classList.add("channel")
        nameButton.id = channel._id

        nameButton.addEventListener("click", click => {
            if (location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] !== "@me") {
                socket.emit("LEAVE_CHANNEL", { channel: { _id: location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] }, user: loggedUser })
            }
            window.sessionStorage.setItem("active_channel", JSON.stringify({ _id: channel._id }))

            location = "http://localhost:3000/@me/" + channel._id
        })

        if (document.getElementById(channel._id) === null)
            channelsWrapper.appendChild(nameButton)
    })
}

export function AddUserToChannel(channelId, username) {
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
            socket.emit("USER_INVITE", username, loggedUser)
        });
}

export async function GetMessages(activeChannel) {
    previousMessage.username = ""
    previousMessage.timestamp = ""
    const messagesDiv = document.getElementById("messages");
    const headers = new Headers()

    headers.append("Authorization", `Bearer ${token}`)
    fetch(
        `${apiURL}/api/messages?channel_id=${activeChannel._id}&chunk=10`,
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

                    GetMessages(activeChannel)
                })
            }
            if (response.ok) return response.json();
        })
        .then(async (response) => {
            const messages = await response.messages;

            if (messages.length <= 0) return messagesDiv.classList.add("empty_messages");
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
            if (await response.channels.length <= 0) return
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
    if (window.sessionStorage.getItem("repliedTo") !== null && window.sessionStorage.getItem("repliedTo") !== "") {
        const repliedTo = JSON.parse(window.sessionStorage.getItem("repliedTo"))
        console.log(repliedTo.username, repliedTo.content)
        message.repliedTo = {
            username: repliedTo.username,
            content: repliedTo.content
        }
    }

    const path = location.pathname
    const channelId = path.split("/").reverse()[0].toString()

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)
    fetch(
        `${apiURL}/api/messages?channel_id=${channelId}`,
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
            document.getElementById("message_box").focus()
            document.getElementById("reply_indicator").innerHTML = ""
            document.getElementById("reply_indicator").style.display = "none"
            window.sessionStorage.setItem("repliedTo", "")
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

    if (message.repliedTo && message.repliedTo.username === loggedUser.username) {
        setTimeout(() => {
            const messageHolder = contentHolder.parentElement.parentElement
            messageHolder.classList.add("mentioned");
            messageHolder.style.backgroundColor = loggedUser.color + "11"
            messageHolder.style.borderTop = "solid " + loggedUser.color
            messageHolder.style.borderBottom = "solid " + loggedUser.color
        }, 100);
    }

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
                        image.onload = () => {
                            setTimeout(() => {
                                ScrollToBottom(true)
                            }, 100)
                        }
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
                image.onload = () => {
                    setTimeout(() => {
                        ScrollToBottom(true)
                    }, 100)
                }
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

    if (onload) return messagesDiv.scrollTo(0, scrollHeight + lastChild.offsetHeight)

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