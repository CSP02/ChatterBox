import HandleErrors from "../handlers/errorHandler.js";
import { AddToMessages, ScrollToBottom, fetchData } from "./Utility.js";

export async function SendMessage(message, params) {
    let socket = params.socket;
    const apiURL = params.apiURL;
    const previousMessage = params.previousMessage;

    previousMessage.username = "";
    previousMessage.timestamp = "";
    if (window.sessionStorage.getItem("repliedTo") !== null && window.sessionStorage.getItem("repliedTo") !== "") {
        const repliedTo = window.sessionStorage.getItem("repliedTo");
        message.repliedTo = repliedTo;
    }

    const path = location.pathname;
    const channelId = path.split("/").reverse()[0].toString();

    const fileUpload = document.getElementById("file_upload");
    const file = fileUpload.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("channel", message.channel);
    formData.append("components", message.components);
    formData.append("content", message.content);
    if (file && file.modfilename !== null)
        formData.append("custom_name", file.modfilename);
    if (message.repliedTo)
        formData.append("repliedTo", message.repliedTo);
    formData.append("user", message.user);
    formData.append("_id", message._id);

    const url = `${apiURL}/messages?channel_id=${channelId}`;
    const body = formData;
    const { response, status } = await fetchData(url, "POST", body);
    if (status !== 200) return HandleErrors(status);
    message._id = await response.messageId;
    message.repliedTo = await response.repliedTo;
    message.components = await response.components;

    socket.emit("MESSAGES", message);
    document.getElementById("message_box").focus();
    document.getElementById("reply_indicator").innerHTML = "";
    document.getElementById("reply_indicator").style.display = "none";
    window.sessionStorage.setItem("repliedTo", "");
}

export async function GetMessages(activeChannel, params, chunkSize = 16, page = 1) {
    const apiURL = params.apiURL;
    const previousMessage = params.previousMessage;

    previousMessage.username = "";
    previousMessage.timestamp = "";
    const messagesDiv = document.getElementById("messages");
    const url = `${apiURL}/messages?channel_id=${activeChannel._id}&chunk=${chunkSize}&page=${page}`;
    const { response, status } = await fetchData(url);
    if (status !== 200) return HandleErrors(status);
    const messages = await response.messages;

    if (messages.length <= 0) return messagesDiv.classList.add("empty_messages");
    messagesDiv.classList.remove("empty_messages");
    messagesDiv.innerHTML = "";
    AddToMessages(messages, response.hasMore, params);
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