import ComponentTypes from "./types.js"

const socket = io();
const messagesHolder = document.getElementById("messages");
let loggedUser = null;
let token = null;
const types = new ComponentTypes()

export function SetDefaults(defaults) {
    token = defaults.token
    loggedUser = JSON.parse(defaults.user)
}

export function SendSocketEvent(event, data) {
    socket.emit(event, data);
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

    messAndUserholder.append(...[usernameHolder, contentHolder]);
    messageHolder.classList.add("message_holder");
    messageHolder.append(...[pfp, messAndUserholder]);

    messagesHolder.appendChild(messageHolder);
}

export async function GetAllMessages(token) {
    const messagesDiv = document.getElementById("messages");
    const headers = new Headers()

    headers.append("Authorization", `Bearer ${token}`)
    fetch(
        "http://localhost:3001/api/get_messages",
        {
            mode: "cors",
            headers: headers
        },
    )
        .then((response) => {
            if (response.ok) return response.json();
        })
        .then(async (response) => {
            const isEmpty = await response.EmptyChat;
            const messages = await response.messages;

            if (await isEmpty) return (messagesDiv.innerText = "No Messages");
            messagesDiv.innerHTML = "";
            messages.forEach((message) => {
                AddToMessages(message);
            });
        });
    ScrollToBottom(false);
}

export async function SendMessage(message) {
    message.reqType = "SEND_MESSAGE";
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)
    fetch(
        "http://localhost:3001/api/send_message",
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
            if (response.ok) return response.json();
        })
        .then(async (response) => {
            socket.emit("MESSAGES", "yes");
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

    fetch(
        "http://localhost:3001/api/profile",
        {
            method: "PUT",
            mode: "cors",
            body: new Blob([JSON.stringify(updateUser)], {
                type: "application/json",
            }),
            headers: headers
        },
    )
        .then(async (response) => {
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
                    title.innerText = component.title

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

export function ScrollToBottom(isInitial) {
    setTimeout(() => {
        const messagesDiv = document.getElementById("messages");
        if (isInitial) {
            if (messagesDiv.scrollHeight >= messagesDiv.clientHeight)
                messagesDiv.scrollTop =
                    messagesDiv.scrollHeight + messagesDiv.clientHeight;
            document.getElementById("new_message_popup").style.display = "none";
            return;
        } else {
            const scrollPos = Math.abs(
                messagesDiv.scrollHeight -
                messagesDiv.clientHeight -
                messagesDiv.scrollTop,
            );
            if (scrollPos <= 0) {
                messagesDiv.scrollTop =
                    messagesDiv.scrollHeight + messagesDiv.clientHeight;
                document.getElementById("new_message_popup").style.display = "none";
            } else {
                if (messagesDiv.scrollHeight >= messagesDiv.clientHeight)
                    document.getElementById("new_message_popup").style.display = "block";
            }
        }
    }, 150);

}

export function LogoutUser() {
    token = null;

    location.reload();
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