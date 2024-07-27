import ComponentTypes from "./types.js"
import { removeEvent } from "../@me/script.js";

let socket
const messagesHolder = document.getElementById("messages");
let loggedUser = null;
let token = null;
let refreshToken = null
const apiURL = "http://localhost:3001"
let activeChannel = { name: "http://localhost:3000/@me" }
const types = new ComponentTypes()
const repliedToCache = { isEmpty: true }

export function SetDefaults(defaults, socketInit) {
    token = defaults.token
    loggedUser = JSON.parse(defaults.user)
    refreshToken = defaults.refreshToken
    activeChannel = JSON.parse(defaults.activeChannel)

    socket = socketInit
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
            if (response.status === 401 && response.error === params.types.ErrorTypes.JWT_EXPIRE) {
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
            else if (response.status === 401 || response.status === 500) {
                alert("Something went wrong! Please reload the website. If this error appeared again please login again.")
            }
            if (response.ok) return response.json()
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
export async function AddToMessages(message) {
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
    const messageId = message._id
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
    contentHolder.id = messageId
    if (repliedTo !== undefined && repliedTo.username !== "") {
        const replyIndicator = document.createElement("button")
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

        replyIndicator.addEventListener("click", e => {
            console.log("test", repliedTo._id)
            const replyM = document.getElementById(repliedTo._id)
            replyM.parentElement.parentElement.scrollIntoView({ block: "center" });
            replyM.classList.add("m_indicator")

            setTimeout(() => {
                replyM.classList.remove("m_indicator")
            }, 1500)
        })
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
        const replyMsgID = reply.parentElement.id
        window.sessionStorage.setItem("repliedTo", JSON.stringify({ _id: replyMsgID }))

        const replyEl = document.createElement("div")
        const username = document.createElement("span")
        const cancelButton = document.createElement("button")
        const closeIcon = document.createElement("i")

        const replyIndicator = document.getElementById("reply_indicator")

        closeIcon.classList.add("fa-solid")
        closeIcon.classList.add("fa-circle-xmark")
        cancelButton.appendChild(closeIcon)
        cancelButton.classList.add("cancel_reply")
        username.innerText = "replying to " + reply.parentElement.previousSibling.firstChild.innerText
        cancelButton.addEventListener("click", click => {
            window.sessionStorage.removeItem("repliedTo")
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

export function SendTypingEvent() {
    socket.emit("TYPING", "Someone is typing!");
}

async function ResolveContent(content, contentHolder, message) {
    let finalText = content.split(/\s/g);
    const text2el = []

    if (message.repliedTo && message.repliedTo.username === loggedUser.username) {
        setTimeout(() => {
            const messageHolder = contentHolder.parentElement.parentElement
            messageHolder.classList.add("mentioned");
            messageHolder.style.backgroundColor = loggedUser.color + "11"
            messageHolder.style.borderTop = "solid " + loggedUser.color
            messageHolder.style.borderBottom = "solid " + loggedUser.color
        }, 100);
    }

    content.split("\n").forEach((data) => {
        data.split(" ").forEach(data => {
            if (data.startsWith("http://") || data.startsWith("https://")) {
                const link = document.createElement("a")
                const text = document.createTextNode(data + "\ ")
                link.href = data;
                link.target = "_blank"
                link.append(text)

                text2el.push(link)
            }

            if (data === `@${loggedUser.username}`) {
                const mentionWrapper = document.createElement("b")
                const mention = document.createTextNode(data + "\ ");

                mention.innerText = data

                mentionWrapper.append(mention)
                text2el.push(mentionWrapper)
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

            if (!(data.includes("http://") || data.includes("https://")) && data !== `@${loggedUser.username}`) {
                const text = document.createTextNode(data + "\ ");
                text2el.push(text)
            }
        })
        const breakEl = document.createElement("br")

        text2el.push(breakEl)
    });

    const wholeTextHolder = document.createElement("span")
    let text = "";
    [...text2el].forEach((node, index) => {
        if (node.nodeType === 3) {
            text += node.data

            if (index === text2el.length - 1) {
                const textEl = document.createElement("span")
                textEl.innerText = text.trim()

                wholeTextHolder.appendChild(textEl)
                text = ""
            }
        } else {
            if (!text || text === "" || text === "\s") return
            const textEl = document.createElement("span")
            textEl.innerText = text.trim()

            wholeTextHolder.appendChild(textEl)
            wholeTextHolder.appendChild(node)
            text = ""
        }

    })

    contentHolder.appendChild(wholeTextHolder)
    if (message.components.length > 0)
        [...message.components].forEach(component => {
            const embedWrapper = document.createElement("div")
            embedWrapper.classList.add("embed")

            const title = document.createElement("h3")
            const description = document.createElement("p")
            const image = new Image()

            if (component.type === types.ComponentTypes.EMBED) {
                if (!component.title && !component.description && !component.image) {
                    const textEl = document.createElement("a")
                    textEl.innerText = component.url.trim()
                    textEl.href = component.url.trim()
                    textEl.target = "_blank"

                    wholeTextHolder.appendChild(textEl)
                    contentHolder.appendChild(wholeTextHolder)
                }
                else {
                    title.classList.add("embed_title")
                    const titleLink = document.createElement("a")
                    titleLink.href = component.url
                    titleLink.innerText = component.title ? component.title : "..."
                    titleLink.target = "_blank"
                    title.appendChild(titleLink)

                    description.classList.add("embed_description")
                    description.innerText = component.description ? component.description : "..."

                    if (component.image) {
                        image.classList.add("embed_image")
                        image.src = component.image
                        image.onload = () => {
                            setTimeout(() => {
                                ScrollToBottom(false)
                            }, 100)
                        }
                        embedWrapper.append(...[title, description, image])
                    } else {
                        embedWrapper.append(...[title, description])
                    }
                    contentHolder.appendChild(embedWrapper)
                    contentHolder.classList.add("message_has_component")
                }
            }

            if (component.type === types.ComponentTypes.IMAGE) {
                const image = new Image
                image.src = component.imageURL
                image.onload = () => {
                    setTimeout(() => {
                        ScrollToBottom(false)
                    }, 100)
                }
                image.classList.add("component_image")
                contentHolder.appendChild(image)
                contentHolder.classList.add("message_has_component")
            }
        });

    // [...document.getElementsByTagName("span")].forEach(span => {
    //     if(span.innerText === "") span.remove()
    // })
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
    const headers = new Headers
    headers.append("Authorization", `Bearer ${token}`)
    fetch("http://localhost:3001/api/logout", {
        mode: "cors",
        headers: headers
    }).then(async response => {
        if (response.ok) return response.json()
    }).then(response => {
        token = null;
        refreshToken = null;
        loggedUser = null

        window.sessionStorage.setItem("token", token)
        window.sessionStorage.setItem("refresh token", refreshToken)
        window.sessionStorage.setItem("user", loggedUser)

        location = "/"
    })
}

export function UpdateTokens(response) {
    window.sessionStorage.setItem("token", response.token)
    window.sessionStorage.setItem("refresh token", response.refreshToken)

    return [response.token, response.refreshToken]
}

export function SendNotification(data, type) {
    const notification = document.getElementById("notification")
    if (type === types.SuccessTypes.SUCCESS) notification.classList.add("success_notify")
    if (type === types.SuccessTypes.FAILED) notification.classList.add("failed_notify")

    notification.innerText = data
    notification.style.marginTop = "0"

    setTimeout(() => {
        notification.style.marginTop = "-100%"
    }, 3000);
}