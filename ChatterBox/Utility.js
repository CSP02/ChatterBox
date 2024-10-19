import Types from "./types.js"
import { removeEvent } from "../@me/script.js";
import { GetMessages, DeleteMessage, EditMessage } from "./Message.js";

let socket;
const messagesHolder = document.getElementById("messages");
let loggedUser = null;
let token = null;
let refreshToken = null;
const apiURL = "http://localhost:3001";
let activeChannel = { name: "http://localhost:3000/@me" };
const types = new Types();
const repliedToCache = { isEmpty: true };

export function SetDefaults(defaults, socketInit) {
    token = defaults.token;
    loggedUser = JSON.parse(defaults.user);
    refreshToken = defaults.refreshToken;
    activeChannel = JSON.parse(defaults.activeChannel);

    socket = socketInit;
}

export function SendSocketEvent(event, data) {
    if (event === "TYPING") {
        const headers = new Headers();
        const channel = JSON.parse(window.sessionStorage.getItem("active_channel"));

        headers.append("Authorization", `Bearer ${token}`);
        fetch(`${apiURL}/api/typing?channel_id=${channel._id}`, {
            mode: "cors",
            headers: headers
        }).then(async response => {
            if (response.status === 401 && response.error === types.ErrorTypes.JWT_EXPIRE) {
                const headers = new Headers();

                headers.append("Authorization", `Bearer ${refreshToken}`);
                fetch(`${apiURL}/api/request_new_token`, {
                    mode: "cors",
                    headers: headers
                }).then(async response => {
                    if (response.ok) return await response.json();
                }).then(response => {
                    token = response.token;
                    refreshToken = response.refreshToken;

                    SendSocketEvent(event, data);
                })
            }
            if (response.ok) return response.json();
        }).then(response => {
            if (response.success) {
                socket.emit(event, data);
                removeEvent();
            }
        })
    } else if (event !== "TYPING")
        socket.emit(event, data);
}

const previousMessage = {
    username: "",
    timestamp: ""
};
let chunkSize = 16;

export async function AddToMessages(messages, fetchedAllMsgs, params) {
    const loadMoreMsg = document.createElement("button");
    loadMoreMsg.id = "load_more_msg";
    loadMoreMsg.textContent = "Load more messages...";

    loadMoreMsg.addEventListener("click", e => {
        GetMessages(activeChannel, params, chunkSize + 16);
        chunkSize += 16;
    })

    messages.forEach(message => {
        const messageHolder = document.createElement("div");
        const usernameHolder = document.createElement("p");
        const timeStampHolder = document.createElement("i");
        const pfp = new Image();
        const messAndUserholder = document.createElement("div");
        const contentHolder = document.createElement("p");

        const username = message.user.username;
        const color = message.user.color;
        const content = message.content;
        const avatarURL = message.user.avatarURL;
        const repliedTo = message.repliedTo;
        const date = new Date(message.timestamp);
        const messageId = message._id;
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


        const usernameButton = document.createElement("button");
        usernameButton.innerText = username + " ";
        usernameHolder.appendChild(usernameButton);
        timeStampHolder.innerText = timeStamp;
        timeStampHolder.classList.add("timestamp");

        usernameHolder.appendChild(timeStampHolder);
        usernameButton.style.color = color;

        if (message.edited) {
            const tooltipHol = document.createElement("div");
            const editedIndicator = document.createElement("i");
            const tooltipDes = document.createElement("tooltip");
            tooltipDes.innerText = "This message is edited!";
            tooltipHol.style = "position: relative;width:auto;";
            tooltipDes.setAttribute("hang", "top");
            tooltipDes.setAttribute("style", "width: max-content;");

            editedIndicator.setAttribute("tooltip", "true");
            tooltipHol.append(...[editedIndicator, tooltipDes]);
            editedIndicator.classList.add("fa-solid", "fa-pen", "edited_indicator");
            usernameHolder.appendChild(tooltipHol);
        }

        usernameHolder.style = "display: flex; align-items: center;";

        pfp.src = avatarURL;
        pfp.height = "50px";
        pfp.width = "50px";
        pfp.classList.add("pfp");

        const pfpButton = document.createElement("button");
        pfpButton.className = "open_profile_card";
        pfpButton.appendChild(pfp);

        pfpButton.addEventListener("click", e => {
            const profilePFP = document.getElementById("profile_card_pfp");
            const profileUname = document.getElementById("profile_username");

            profilePFP.src = pfp.src;
            profileUname.innerText = username;

            document.getElementById("profile_card_holder").style.zIndex = "12";
        })
        usernameButton.classList.add("chat_username");
        usernameButton.style.backgroundColor = "transparent";
        usernameButton.style.border = "none";

        usernameButton.addEventListener("click", event => {
            const messageBox = document.getElementById("message_box");
            messageBox.innerText += `@${usernameButton.innerText}`;
            messageBox.focus();
        })

        contentHolder.classList.add("message_db");
        contentHolder.id = messageId;
        if (repliedTo !== undefined && repliedTo.username !== "") {
            const replyIndicator = document.createElement("button");
            const userPfp = document.createElement("img");
            const username = document.createElement("span");
            const content = document.createElement("span");

            username.innerText = repliedTo.username;
            content.innerText = repliedTo.content;
            content.classList.add("reply_content");
            userPfp.src = repliedTo.avatarURL;
            userPfp.style = "height:25px;width:25px;border-radius:50%;";

            username.style.color = repliedTo.color;

            replyIndicator.append(...[userPfp, username, content]);
            replyIndicator.classList.add("replied_to");

            replyIndicator.addEventListener("click", e => {
                const replyM = document.getElementById(repliedTo._id);
                replyM.parentElement.parentElement.scrollIntoView({ block: "center" });
                replyM.classList.add("m_indicator");

                setTimeout(() => {
                    replyM.classList.remove("m_indicator");
                }, 1500);
            })
            messAndUserholder.appendChild(replyIndicator);

            pfp.style.marginTop = "calc(25px + 1.2rem)";
        }
        ResolveContent(content, contentHolder, message);
        const deleteMsg = document.createElement("button");
        const delIcon = document.createElement("i");
        delIcon.classList.add("fa-solid");
        delIcon.classList.add("fa-trash");
        delIcon.style.color = "#ca5353";
        deleteMsg.classList.add("del_icon");
        deleteMsg.append(delIcon);

        deleteMsg.addEventListener("click", e => {
            DeleteMessage(deleteMsg, params);
        })

        const editMsg = document.createElement("button");
        const editIcon = document.createElement("i");
        editIcon.classList.add("fa-solid");
        editIcon.classList.add("fa-pen");
        editMsg.classList.add("edit_icon");
        editMsg.append(editIcon);

        editMsg.addEventListener("click", e => {
            const message = editMsg.parentElement.parentElement;
            message.firstChild.setAttribute("contenteditable", true);
            message.firstChild.classList.add("active_edit");
            message.firstChild.focus();
            message.firstChild.addEventListener("input", e => {
                if (e.inputType === "insertParagraph" || (e.inputType === "insertText" && e.data === null)) {
                    message.firstChild.removeAttribute("contenteditable");
                    message.firstChild.classList.remove("active_edit");
                    EditMessage(message, message.innerText.trim(), params);
                }
            })
        })

        const reply = document.createElement("button");
        const icon = document.createElement("i");
        icon.classList.add("fa-solid");
        icon.classList.add('fa-reply');
        reply.classList.add("reply_icon");
        reply.append(icon);

        reply.addEventListener("click", click => {
            const replyMsgID = reply.parentElement.parentElement.id;
            window.sessionStorage.setItem("repliedTo", JSON.stringify({ _id: replyMsgID }));

            const replyEl = document.createElement("div");
            const username = document.createElement("span");
            const cancelButton = document.createElement("button");
            const closeIcon = document.createElement("i");

            const replyIndicator = document.getElementById("reply_indicator");

            closeIcon.classList.add("fa-solid");
            closeIcon.classList.add("fa-circle-xmark");
            cancelButton.appendChild(closeIcon);
            cancelButton.classList.add("cancel_reply");
            username.innerText = "replying to " + reply.parentElement.previousSibling.firstChild.innerText;
            cancelButton.addEventListener("click", click => {
                window.sessionStorage.removeItem("repliedTo");
                replyEl.remove();
                replyIndicator.style.display = "none";
                document.getElementById("message_box").focus();
            })
            replyEl.append(...[username, cancelButton]);

            replyIndicator.style.display = "flex";
            replyIndicator.innerHTML = "";
            replyIndicator.appendChild(replyEl);

            document.getElementById("message_box").focus();
        })

        const msgOptionsGrp = document.createElement("div");
        if (loggedUser.username === message.user.username)
            msgOptionsGrp.append(...[reply, editMsg, deleteMsg]);
        else
            msgOptionsGrp.append(reply);

        msgOptionsGrp.id = "msg_opt_grp";

        contentHolder.append(msgOptionsGrp);
        messageHolder.classList.add("message_holder");

        messAndUserholder.classList.add("message_user_holder");

        if (previousMessage.username !== "" && previousMessage.timestamp !== "" && !message.repliedTo) {
            if (previousMessage.username === username && new Date(message.timestamp) - new Date(previousMessage.timestamp) <= 60000 && messagesHolder.children.length > 0) {
                const prevMessHolder = messagesHolder.lastChild.lastChild;
                prevMessHolder.appendChild(contentHolder);
                previousMessage.username = username;
                previousMessage.timestamp = new Date(message.timestamp);
                return;
            } else {
                messAndUserholder.append(...[usernameHolder, contentHolder]);
                messageHolder.append(...[pfpButton, messAndUserholder]);
            }
        } else {
            messAndUserholder.append(...[usernameHolder, contentHolder]);
            messageHolder.append(...[pfpButton, messAndUserholder]);
        }
        previousMessage.username = username;
        previousMessage.timestamp = new Date(message.timestamp);
        if (!fetchedAllMsgs) {
            if ([...messagesHolder.children].filter(el => el === loadMoreMsg).length <= 0)
                messagesHolder.appendChild(loadMoreMsg);
        }
        messagesHolder.appendChild(messageHolder);
    })
}

export function SendJoinEvent(channel, activeChannel) {
    socket.emit("JOIN_CHANNEL", { channel: channel, user: loggedUser });
    activeChannel = channel;
}

export function SendTypingEvent() {
    socket.emit("TYPING", "Someone is typing!");
}

async function ResolveContent(content, contentHolder, message) {
    let finalText = content.split(/\s/g);
    const text2el = [];

    if (message.repliedTo && message.repliedTo.username === loggedUser.username) {
        setTimeout(() => {
            const messageHolder = contentHolder.parentElement.parentElement;
            messageHolder.classList.add("mentioned");
            messageHolder.style.backgroundColor = loggedUser.color + "11";
            messageHolder.style.borderTop = "solid " + loggedUser.color;
            messageHolder.style.borderBottom = "solid " + loggedUser.color;
        }, 100);
    }

    content.split("\n").forEach((data) => {
        data.split(" ").forEach((data, index) => {
            if (data.startsWith("http://") || data.startsWith("https://")) {
                const link = document.createElement("a");
                const text = document.createTextNode(data + "\ ");
                link.href = data;
                link.target = "_blank";
                link.append(text);

                text2el.push(link);
            }

            if (data === `@${loggedUser.username}`) {
                const mentionWrapper = document.createElement("b");
                const mention = document.createTextNode(data + "\ ");

                mention.innerText = data;

                mentionWrapper.append(mention);
                text2el.push(mentionWrapper);
                setTimeout(() => {
                    const messageHolder = contentHolder.parentElement.parentElement;
                    messageHolder.classList.add("mentioned");
                    messageHolder.style.backgroundColor = loggedUser.color + "11";
                    messageHolder.style.borderTop = "solid " + loggedUser.color;
                    messageHolder.style.borderBottom = "solid " + loggedUser.color;
                }, 100);
            }

            if (!(data.includes("http://") || data.includes("https://")) && data !== `@${loggedUser.username}`) {
                const text = document.createTextNode(data + "\ ");
                text2el.push(text);
            }
        })
        const breakEl = document.createElement("br");

        text2el.push(breakEl);
    });

    const wholeTextHolder = document.createElement("span");
    let text = "";
    [...text2el].forEach((node, index) => {
        if (node.nodeType === 3) {
            text += node.data;

            if (index === text2el.length - 1 || isMD(text.trim())) {
                const md = constructMD(text.trim());

                const textEl = document.createElement("span");
                textEl.appendChild(md);

                wholeTextHolder.appendChild(textEl);
                text = "";
            }
        } else {
            if ((!text || text === "" || text === "\s") && node.nodeName === "BR") return;
            const italic = document.createElement("i");
            italic.innerText = node.innerText.slice(1, node.innerText.length - 2);

            const textEl = document.createElement("span");
            if (node.nodeName !== "BR" && node.innerText.trim().startsWith("*") && node.innerText.trim().endsWith("*")) textEl.appendChild(italic);
            else textEl.innerText = text.trim();

            wholeTextHolder.appendChild(textEl);
            wholeTextHolder.appendChild(node);
        }
    })

    contentHolder.appendChild(wholeTextHolder)
    if (message.components.length > 0)
        [...message.components].forEach(component => {
            const embedWrapper = document.createElement("div");
            embedWrapper.classList.add("embed");

            const title = document.createElement("h3");
            const description = document.createElement("p");
            const image = new Image();

            if (component.type === types.ComponentTypes.EMBED) {
                if (!component.title && !component.description && !component.image) {
                    const textEl = document.createElement("a");
                    textEl.innerText = component.url.trim();
                    textEl.href = component.url.trim();
                    textEl.target = "_blank";

                    wholeTextHolder.appendChild(textEl);
                    contentHolder.appendChild(wholeTextHolder);
                }
                else {
                    title.classList.add("embed_title");
                    const titleLink = document.createElement("a");
                    titleLink.href = component.url;
                    titleLink.innerText = component.title ? component.title : "...";
                    titleLink.target = "_blank";
                    title.appendChild(titleLink);

                    description.classList.add("embed_description");
                    description.innerText = component.description ? component.description : "...";

                    if (component.image) {
                        image.classList.add("embed_image");
                        image.src = component.image;
                        image.onload = () => {
                            setTimeout(() => {
                                ScrollToBottom(false);
                            }, 100);
                        }
                        embedWrapper.append(...[title, description, image]);
                    } else {
                        embedWrapper.append(...[title, description]);
                    }
                    contentHolder.appendChild(embedWrapper);
                    contentHolder.classList.add("message_has_component");
                }
            }

            if (component.type === types.ComponentTypes.IMAGE) {
                const image = new Image;
                image.src = component.imageURL;
                image.onload = () => {
                    setTimeout(() => {
                        ScrollToBottom(false);
                    }, 100);
                };
                image.classList.add("component_image");
                contentHolder.appendChild(image);
                contentHolder.classList.add("message_has_component");
            }
        });

    // [...document.getElementsByTagName("span")].forEach(span => {
    //     if(span.innerText === "") span.remove()
    // })
}

function isMD(data) {
    return (data.startsWith("~") && data.endsWith("~")) ||
        (data.startsWith("*") && data.endsWith("*")) ||
        (data.startsWith("^") && data.endsWith("^"));
}

function constructMD(data) {
    if (!isMD(data)) {
        const span = document.createTextNode(data.toString());
        return span;
    }
    switch (data[0]) {
        case "~":
            const strike = document.createElement("cross");
            strike.appendChild(constructMD(data.slice(1, data.length - 1)));
            return strike;
        case "*":
            const italic = document.createElement("i");
            italic.appendChild(constructMD(data.slice(1, data.length - 1)));
            return italic;
        case "^":
            const bold = document.createElement("b");
            bold.appendChild(constructMD(data.slice(1, data.length - 1)));
            return bold;
    }
}

export function ScrollToBottom(onload) {
    const messagesDiv = document.getElementById("messages");
    const scrollHeight = messagesDiv.scrollHeight;
    const scrollTop = messagesDiv.scrollTop;
    const offsetHeight = messagesDiv.offsetHeight;
    const lastChild = messagesDiv.lastChild;

    if (onload) return messagesDiv.scrollTo(0, scrollHeight + lastChild.offsetHeight);

    if (scrollHeight <= scrollTop + offsetHeight + 140) {
        messagesDiv.scrollTo(0, scrollHeight + lastChild.offsetHeight);
        document.getElementById("new_message_popup").style.display = "none";
    } else {
        if (scrollHeight >= messagesDiv.clientHeight)
            document.getElementById("new_message_popup").style.display = "block";
    }
}

export function LogoutUser() {
    const headers = new Headers;
    headers.append("Authorization", `Bearer ${token}`);
    fetch("http://localhost:3001/api/logout", {
        mode: "cors",
        headers: headers
    }).then(async response => {
        if (response.ok) return response.json();
    }).then(response => {
        token = null;
        refreshToken = null;
        loggedUser = null;

        window.sessionStorage.setItem("token", token);
        window.sessionStorage.setItem("refresh token", refreshToken);
        window.sessionStorage.setItem("user", loggedUser);

        location = "/";
    });
}

export function UpdateTokens(response) {
    window.sessionStorage.setItem("token", response.token);
    window.sessionStorage.setItem("refresh token", response.refreshToken);

    return [response.token, response.refreshToken];
}

export function SendNotification(data, type) {
    const notification = document.getElementById("notification");
    if (type === types.SuccessTypes.SUCCESS) notification.classList.add("success_notify");
    if (type === types.SuccessTypes.FAILED) notification.classList.add("failed_notify");

    notification.innerText = data;
    notification.style.marginTop = "0";

    setTimeout(() => {
        notification.style.marginTop = "-100%";
    }, 3000);
}

export async function fetchData(url, method = "GET", body = null) {
    let token = window.sessionStorage.getItem("token");
    let refreshToken = window.sessionStorage.getItem("refresh token");

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    const reqOpts = {
        mode: 'cors',
        method: method,
        headers: headers
    }
    if (body !== null) reqOpts.body = body;
    const response = await fetch(url, reqOpts);
    if (response.ok)
        return { response: await response.json(), status: response.status };
    else {
        if (response.status === 401 && response.error === types.ErrorTypes.JWT_EXPIRE) {
            await requestNewToken(refreshToken);
            await fetchData(url, method, body);
        } else
            return alert("something went wrong! please reload the site.");
    }
}

async function requestNewToken(refreshToken) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${refreshToken}`);
    const response = await fetch(`http://localhost:3001/api/request_new_token`, {
        mode: "cors",
        headers: headers
    })
    if (response.ok) {
        const resJson = await response.json();
        UpdateTokens(resJson);
    }
}