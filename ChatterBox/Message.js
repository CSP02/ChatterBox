import { AddToMessages, ScrollToBottom, UpdateTokens } from "./Utility.js";

export async function SendMessage(message, params) {
    let socket = params.socket;
    let token = window.sessionStorage.getItem("token");
    let refreshToken = window.sessionStorage.getItem("refresh token");
    const apiURL = params.apiURL;
    const types = params.types;
    const previousMessage = params.previousMessage;

    previousMessage.username = "";
    previousMessage.timestamp = "";
    if (window.sessionStorage.getItem("repliedTo") !== null && window.sessionStorage.getItem("repliedTo") !== "") {
        const repliedTo = JSON.parse(window.sessionStorage.getItem("repliedTo"));
        message.repliedTo = repliedTo;
    }

    const path = location.pathname;
    const channelId = path.split("/").reverse()[0].toString();

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);
    fetch(`${apiURL}/api/messages?channel_id=${channelId}`, {
        method: "POST",
        mode: "cors",
        body: new Blob([JSON.stringify(message)], {
            type: "application/json",
        }),
        headers: headers
    }).then((response) => {
        if (response.status === 401 && response.error === types.ErrorTypes.JWT_EXPIRE) {
            const headers = new Headers();

            headers.append("Authorization", `Bearer ${refreshToken}`);
            fetch(`${apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json();
            }).then(response => {
                [token, refreshToken] = UpdateTokens(response);
                SendMessage(message, params);
            })
        } else if (response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.");
        }
        if (response.ok) return true;
    }).then(async (response) => {
        if (!response) return;
        socket.emit("MESSAGES", channelId);
        document.getElementById("message_box").focus();
        document.getElementById("reply_indicator").innerHTML = "";
        document.getElementById("reply_indicator").style.display = "none";
        window.sessionStorage.setItem("repliedTo", "");
    });
}

export async function GetMessages(activeChannel, params, chunkSize = 16) {
    let token = window.sessionStorage.getItem("token");
    let refreshToken = window.sessionStorage.getItem("refresh token");
    const apiURL = params.apiURL;
    const types = params.types;
    const previousMessage = params.previousMessage;

    previousMessage.username = "";
    previousMessage.timestamp = "";
    const messagesDiv = document.getElementById("messages");
    const headers = new Headers();

    headers.append("Authorization", `Bearer ${token}`);
    fetch(`${apiURL}/api/messages?channel_id=${activeChannel._id}&chunk=${chunkSize}`, {
        mode: "cors",
        headers: headers
    }).then((response) => {
        if (response.status === 401 && response.error === types.ErrorTypes.JWT_EXPIRE) {
            const headers = new Headers();

            headers.append("Authorization", `Bearer ${refreshToken}`);
            fetch(`${apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json();
            }).then(response => {
                [token, refreshToken] = UpdateTokens(response);
                GetMessages(activeChannel, params);
            })
        } else if (response.status === 401 || response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.");
        }
        if (response.ok) return response.json();
    }).then(async (response) => {
        const messages = await response.messages;

        if (messages.length <= 0) return messagesDiv.classList.add("empty_messages");
        messagesDiv.classList.remove("empty_messages");
        messagesDiv.innerHTML = "";
        AddToMessages(messages, response.fetched_all_messages, params);
        ScrollToBottom(false);
    });
}

export async function DeleteMessage(deleteMsg, params) {
    let token = window.sessionStorage.getItem("token");
    let refreshToken = window.sessionStorage.getItem("refresh token");

    const messageId = deleteMsg.parentElement.parentElement.id;
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    fetch(`${params.apiURL}/api/delete_msg?id=${messageId}`, {
        mode: "cors",
        headers: headers,
    }).then(async response => {
        if (response.ok) return response.json();

        if (response.status === 401 && response.error === params.types.ErrorTypes.JWT_EXPIRE) {
            const headers = new Headers();

            headers.append("Authorization", `Bearer ${refreshToken}`);
            fetch(`${apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json();
            }).then(response => {
                [token, refreshToken] = UpdateTokens(response);
                DeleteMessage(deleteMsg, params);
            })
        }
    }).then(async response => {
        if (deleteMsg.parentElement.parentElement.nextSibling === null && deleteMsg.parentElement.parentElement.previousSibling.id === '')
            deleteMsg.parentElement.parentElement.parentElement.parentElement.remove();
        else
            deleteMsg.parentElement.parentElement.remove();
    })
}

export async function EditMessage(message, content, params) {
    let token = window.sessionStorage.getItem("token");
    let refreshToken = window.sessionStorage.getItem("refresh token");
    const messageId = message.id;

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    fetch(`${params.apiURL}/api/edit_msg?id=${messageId}`, {
        mode: "cors",
        headers: headers,
        method: "PUT",
        body: new Blob([JSON.stringify({ content: content })], {
            type: "application/json",
        }),
    }).then(async response => {
        if (response.ok) return response.json();

        if (response.status === 401 && response.error === params.types.ErrorTypes.JWT_EXPIRE) {
            const headers = new Headers();

            headers.append("Authorization", `Bearer ${refreshToken}`);
            fetch(`${params.apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json();
            }).then(response => {
                [token, refreshToken] = UpdateTokens(response);
                EditMessage(message, params);
            })
        }
    }).then(async response => {
        const activeChannel = window.sessionStorage.getItem("active_channel");
        GetMessages(JSON.parse(activeChannel), params);
    })
}