import HandleErrors from "../handlers/errorHandler.js";
import { AddToMessages, ScrollToBottom, fetchData } from "./Utility.js";

export async function SendMessage(message, params) {
    let socket = params.socket;
    const apiURL = params.apiURL;
    const previousMessage = params.previousMessage;

    previousMessage.username = "";
    previousMessage.timestamp = "";
    if (window.sessionStorage.getItem("repliedTo") !== null && window.sessionStorage.getItem("repliedTo") !== "") {
        const repliedTo = JSON.parse(window.sessionStorage.getItem("repliedTo"));
        message.repliedTo = repliedTo;
    }

    const path = location.pathname;
    const channelId = path.split("/").reverse()[0].toString();

    const url = `${apiURL}/messages?channel_id=${channelId}`;
    const body = new Blob([JSON.stringify(message)], {
        type: "application/json",
    });
    const { response, status } = await fetchData(url, "POST", body);
    if (status !== 200) return HandleErrors(status);
    message._id = response.messageId;
    socket.emit("MESSAGES", message);
    document.getElementById("message_box").focus();
    document.getElementById("reply_indicator").innerHTML = "";
    document.getElementById("reply_indicator").style.display = "none";
    window.sessionStorage.setItem("repliedTo", "");
}

export async function GetMessages(activeChannel, params, chunkSize = 16) {
    const apiURL = params.apiURL;
    const previousMessage = params.previousMessage;

    previousMessage.username = "";
    previousMessage.timestamp = "";
    const messagesDiv = document.getElementById("messages");
    const url = `${apiURL}/messages?channel_id=${activeChannel._id}&chunk=${chunkSize}`;
    const { response, status } = await fetchData(url);
    if (status !== 200) return HandleErrors(status);
    const messages = await response.messages;

    if (messages.length <= 0) return messagesDiv.classList.add("empty_messages");
    messagesDiv.classList.remove("empty_messages");
    messagesDiv.innerHTML = "";
    AddToMessages(messages, response.fetched_all_messages, params);
    if (document.getElementById("messages_loading"))
        document.getElementById("messages_loading").style.display = "none";
    ScrollToBottom(false);
}

export async function DeleteMessage(deleteMsg, params) {
    let socket = params.socket;

    const messageId = deleteMsg.parentElement.parentElement.id;

    const url = `${params.apiURL}/delete_msg?id=${messageId}`;
    const { response, status } = await fetchData(url, "DELETE");
    if (status !== 200) return HandleErrors(status);
    socket.emit("DEL_MSG", { id: deleteMsg.parentElement.parentElement.id, channel: JSON.parse(window.sessionStorage.getItem("active_channel")) });
}

export async function EditMessage(message, content, params) {
    let socket = params.socket;
    const messageId = message.id;

    const url = `${params.apiURL}/edit_msg?id=${messageId}`;
    const body = new Blob([JSON.stringify({ content: content })], {
        type: "application/json",
    })

    const { response, status } = await fetchData(url, "PUT", body);
    if (status !== 200) return HandleErrors(status);
    const activeChannel = JSON.parse(window.sessionStorage.getItem("active_channel"));
    socket.emit("EDIT_MSG", { mid: messageId, cid: activeChannel._id, content: content });
}