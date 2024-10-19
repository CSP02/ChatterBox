import { fetchData } from "./Utility.js";

export async function CreateChannel(params) {
    const apiURL = params.apiURL;

    const channelName = document.getElementById("channel_name").value;
    const body = new Blob([JSON.stringify({
        channelName: channelName
    })], { type: "application/json" })
    const url = `${apiURL}/api/channels`;

    const { response, status } = await fetchData(url, "POST", body);
    if (status !== 200) return alert("something went wrong!");
    AddToChannels([response.channel]);
}

export async function GetChannels(params) {
    const apiURL = params.apiURL;
    const url = `${apiURL}/api/channels`;

    const { response, status } = await fetchData(url);
    if (status !== 200) return alert("something went wrong!");
    if (await response.channels.length <= 0) return;
    const channels = await response.channels;

    AddToChannels(channels, params.socket);
    window.sessionStorage.setItem("channels", JSON.stringify(channels));
}

function AddToChannels(channels, socket) {
    const channelsWrapper = document.getElementById("channels");

    channels.forEach(channel => {
        const channelName = channel.name;
        const iconURL = channel.iconURL;
        const loggedUser = window.sessionStorage.getItem("user");

        const nameButton = document.createElement("button");
        nameButton.innerText = channelName;
        nameButton.classList.add("inactive");
        nameButton.classList.add("channel");
        nameButton.id = channel._id;

        nameButton.addEventListener("click", click => {
            if (location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] !== "@me") {
                socket.emit("LEAVE_CHANNEL", { channel: { _id: location.pathname.split("/").join(" ").trim().split(" ").reverse()[0] }, user: loggedUser });
            }
            window.sessionStorage.setItem("active_channel", JSON.stringify({ _id: channel._id }));
            location = "http://localhost:3000/@me/" + channel._id;
        })

        if (document.getElementById(channel._id) === null)
            channelsWrapper.appendChild(nameButton);
    })
}