import { fetchData, SendNotification, UpdateTokens } from "./Utility.js";
import Types from "./types.js";

const types = new Types();
export async function SearchUser(username, params) {
    const url = `${params.apiURL}/api/search_user?username=${username}`;
    const { response, status } = await fetchData(url);
    if (status !== 200) return alert("something went wrong!");
    const uname = response.username;
    const avatarURL = response.avatarURL;
    const resultHolder = document.getElementById("users_search_results");
    
    if (response.error && response.error === types.ErrorTypes.USER_NOT_FOUND) return resultHolder.innerText = "User not found!";

    resultHolder.innerHTML = "";
    const avatar = new Image();
    avatar.src = avatarURL;
    avatar.classList.add("pfp");

    const usernameHolder = document.createElement("span");
    usernameHolder.innerText = uname;

    const selectUser = document.createElement("input");
    selectUser.type = "checkbox";
    selectUser.name = "user_selection";
    selectUser.id = "user_selection";

    selectUser.addEventListener("change", e => {
        const inviteButton = document.getElementById("invite_okay");
        if (selectUser.checked) inviteButton.removeAttribute("disabled");
        else inviteButton.setAttribute("disabled", true);
    })

    const label = document.createElement("label");
    label.classList.add("user_details_holder");
    label.setAttribute("for", "user_selection");
    label.append(...[avatar, usernameHolder]);

    const result = document.createElement("div");
    result.classList.add("online_users");
    result.classList.add("result_user");
    result.append(...[label, selectUser]);
    resultHolder.append(result);
}

export async function UpdateUser(params) {
    const apiURL = params.apiURL;

    const updateUsername = document.getElementById("profile_username");
    const updateColor = document.getElementById("profile_color");
    const updateAvatarURL = document.getElementById("profile_avatar_url");
    const body = new Blob([JSON.stringify({
        username: updateUsername.value,
        color: updateColor.value,
        avatarURL: updateAvatarURL.value,
    })], {
        type: "application/json",
    });

    const url = `${apiURL}/api/profile`;

    const { response, status } = await fetchData(url, "PUT", body);
    if (status !== 200) return alert("something went wrong!");
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

    const image = new Image();
    image.src = updatedPfp;
    profilePfp.appendChild(image);

    colorInNav.value = updatedColor;

    profilePagePfp.src = updatedPfp;
    profilePageUsername.value = updatedUsername;
    profilePageColor.value = updatedColor;
    profilePageAvatarURL.value = updatedPfp;
}

export async function AddUserToChannel(channelId, username, params) {
    let loggedUser = JSON.parse(window.sessionStorage.getItem("user"));
    const apiURL = params.apiURL;
    let socket = params.socket;

    const url = `${apiURL}/api/add_user?channel_id=${channelId._id}&username=${username}`;
    const { response, status } = await fetchData(url);
    if (status !== 200) return alert("something went wrong!");
    if (response.error === types.ErrorTypes.USER_ALREADY_EXIST) return SendNotification("User already exist!", types.SuccessTypes.FAILED);
    SendNotification("Added " + username + " to this channel successfully 😎", types.SuccessTypes.SUCCESS);
    socket.emit("USER_INVITE", username, loggedUser);
}