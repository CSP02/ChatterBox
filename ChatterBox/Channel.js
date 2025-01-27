import HandleErrors from "../handlers/errorHandler.js";
import { fetchData } from "./Utility.js";

export async function CreateChannel(params) {
    const apiURL = params.apiURL;

    const channelName = document.getElementById("channel_name").value;
    const channelIcon = document.getElementById("channel_icon").files[0];
    if (!channelName) return HandleErrors(400, "Channel name is required.");

    const formData = new FormData();
    formData.append("channelName", channelName);
    formData.append("channelIcon", channelIcon);

    const url = `${apiURL}/channels`;
    const { response, status } = await fetchData(url, "POST", formData);
    if (status !== 200) return HandleErrors(status);
    AddToChannels([response.channel]);
}

export async function GetChannels(params) {
    const apiURL = params.apiURL;
    const url = `${apiURL}/channels`;

    const { response, status } = await fetchData(url);
    if (status !== 200) return HandleErrors(status);
    if (await response.channels.length <= 0) return;
    const channels = await response.channels;

    AddToChannels(channels, params.socket);
    window.sessionStorage.setItem("channels", JSON.stringify(channels));
}

export async function UpdateChannel(params) {
    const apiURL = params.apiURL;
    const activeChannelId = JSON.parse(window.sessionStorage.getItem("active_channel"))._id;
    const newChnlName = document.getElementById("new_channel_name").value;
    const newIcon = document.getElementById("update_icon").files[0];

    const formData = new FormData();
    formData.append("channelName", newChnlName);
    formData.append("channelIcon", newIcon);

    const body = formData;
    const url = `${apiURL}/channels?id=${activeChannelId}`;

    const { response, status } = await fetchData(url, "PUT", body);
    if (status !== 200) return HandleErrors(status);

    document.getElementById("success_notif").innerText = "Updated Successfully!";
    document.getElementById("success_notif").style.display = "flex";

    setTimeout(() => {
        document.getElementById("success_notif").style.display = "none";
    }, 5000);
}

function AddToChannels(channels, socket) {
    const channelsWrapper = document.getElementById("channels");

    channels.forEach(channel => {
        const channelName = channel.name;
        const iconURL = channel.iconURL;
        const loggedUser = window.sessionStorage.getItem("user");

        const nameButton = document.createElement("button");
        const channelIcon = document.createElement("img");
        const tooltip = document.createElement("tooltip");
        const buttonHolder = document.createElement("div");

        channelIcon.src = iconURL;
        nameButton.title = channelName;
        tooltip.innerText = channelName;
        tooltip.classList.add("channel_title");

        iconURL === "" ? (nameButton.innerText = channelName[0].toUpperCase()) : nameButton;
        nameButton.classList.add("inactive");
        nameButton.classList.add("channel");
        nameButton.id = channel._id;
        nameButton.append(channelIcon);

        nameButton.addEventListener("click", click => {
            if (location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] !== "@me") {
                socket.emit("LEAVE_CHANNEL", { channel: { _id: location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] }, user: loggedUser });
            }
            window.sessionStorage.setItem("active_channel", JSON.stringify({ _id: channel._id }));
            location = "http://localhost:3000/@me/" + channel._id;
        })

        buttonHolder.append(...[nameButton, tooltip]);
        if (document.getElementById(channel._id) === null)
            channelsWrapper.appendChild(buttonHolder);
    })
}