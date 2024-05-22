import { SendNotification, UpdateTokens } from "./Utility.js";

export async function SearchUser(username, params) {
    let types = params.types
    let token = window.sessionStorage.getItem("token")
    let refreshToken = window.sessionStorage.getItem("refresh token")

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)

    fetch(`${params.apiURL}/api/search_user?username=${username}`, {
        method: "GET",
        mode: "cors",
        headers: headers
    }
    ).then(async response => {
        const resultHolder = document.getElementById("users_search_results")
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
                SearchUser(username, params)
            })
        } else if (response.status === 401 || response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.")
        }
        if (response.status === 404) return types.ErrorTypes.USER_NOT_FOUND
        if (response.ok) return await response.json()
    }).then(response => {
        const resultHolder = document.getElementById("users_search_results")
        if (response === types.ErrorTypes.USER_NOT_FOUND) return resultHolder.innerText = "User not found!"
        const username = response.username
        const avatarURL = response.avatarURL

        resultHolder.innerHTML = ""
        const avatar = new Image()
        avatar.src = avatarURL
        avatar.classList.add("pfp")

        const usernameHolder = document.createElement("span")
        usernameHolder.innerText = username

        const selectUser = document.createElement("input")
        selectUser.type = "checkbox"
        selectUser.name = "user_selection"
        selectUser.id = "user_selection"

        selectUser.addEventListener("change", e => {
            const inviteButton = document.getElementById("invite_okay")
            if (selectUser.checked) inviteButton.removeAttribute("disabled")
            else inviteButton.setAttribute("disabled", true)
        })

        const label = document.createElement("label")
        label.classList.add("user_details_holder")
        label.setAttribute("for", "user_selection")
        label.append(...[avatar, usernameHolder])

        const result = document.createElement("div")
        result.classList.add("online_users")
        result.classList.add("result_user")
        result.append(...[label, selectUser])
        resultHolder.append(result)
    })
}

export async function UpdateUser(params) {
    const apiURL = params.apiURL
    let token = window.sessionStorage.getItem("token")
    let refreshToken = window.sessionStorage.getItem("refresh token")

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
    }).then(async (response) => {
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
                UpdateUser(params)
            })
        } else if (response.status === 401 || response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.")
        }
        if (response.ok) return await response.json();
    }).then((response) => {
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

export function AddUserToChannel(channelId, username, params) {
    let token = window.sessionStorage.getItem("token")
    let refreshToken = window.sessionStorage.getItem("refresh token")
    let loggedUser = JSON.parse(window.sessionStorage.getItem("user"))
    const apiURL = params.apiURL
    let socket = params.socket
    const types = params.types

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${token}`)

    fetch(`${apiURL}/api/add_user?channel_id=${channelId._id}&username=${username}`, {
        mode: "cors",
        headers: headers
    }).then(async (response) => {
        if (response.status === 401 && response.error === types.ErrorTypes.JWT_EXPIRE) {
            const headers = new Headers()

            headers.append("Authorization", `Bearer ${refreshToken}`)
            fetch(`${apiURL}/api/request_new_token`, {
                mode: "cors",
                headers: headers
            }).then(async response => {
                if (response.ok) return await response.json()
            }).then(response => {
                [token, refreshToken] = UpdateTokens(response)
                AddUserToChannel(channelId, username)
            })
        } else if (response.status === 401 || response.status === 500) {
            alert("Something went wrong! Please reload the website. If this error appeared again please login again.")
        }
        if (response.ok) return await response.json();
    }).then((response) => {
        if (response.error === types.ErrorTypes.USER_ALREADY_EXIST) return SendNotification("User already exist!", types.SuccessTypes.FAILED)
        SendNotification("Added " + username + " to this channel successfully 😎", types.SuccessTypes.SUCCESS)
        socket.emit("USER_INVITE", username, loggedUser)
    });
}