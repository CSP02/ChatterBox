import { UpdateTokens } from "./Utility.js"

export async function CreateChannel(params) {
    let token = window.sessionStorage.getItem("token")
    let refreshToken = window.sessionStorage.getItem("refresh token")
    const apiURL = params.apiURL

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
        if (response.status === 401 && response.error === params.types.ErrorTypes.JWT_EXPIRE) {
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
                [token, refreshToken] = UpdateTokens(response)
                CreateChannel(params)
            })
        } else if (response.status === 401 || response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.")
        }
        if (response.ok) return response.json();
    })
        .then(async (response) => {
            if (!response.channel) return
            AddToChannels([response.channel])
        });
}

export async function GetChannels(params) {
    let token = window.sessionStorage.getItem("token")
    let refreshToken = window.sessionStorage.getItem("refresh token")
    const apiURL = params.apiURL

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)

    fetch(`${apiURL}/api/channels`, {
        mode: "cors",
        headers: headers
    }).then((response) => {
        if (response.status === 401 && response.error === params.types.ErrorTypes.JWT_EXPIRE) {
            const headers = new Headers()

            headers.append("Authorization", `Bearer ${refreshToken}`)
            fetch(`${apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json()
            }).then(response => {
                [token, refreshToken] = UpdateTokens(response)
                GetChannels(params)
            })
        } else if (response.status === 401 || response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.")
        }
        if (response.ok) return response.json();
    })
        .then(async (response) => {
            if (await response.channels.length <= 0) return
            const channels = await response.channels

            AddToChannels(channels, params.socket)
            window.sessionStorage.setItem("channels", JSON.stringify(channels))
        });
}

function AddToChannels(channels, socket) {
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