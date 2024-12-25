import HandleErrors from "../handlers/errorHandler.js";
import { fetchData, SendNotification } from "./Utility.js";
import Types from "./types.js";

const types = new Types();
export async function SearchUser(username, params) {
    const url = `${params.apiURL}/search_user?username=${username}`;
    const { response, status } = await fetchData(url);
    if (status !== 200) return HandleErrors(status);
    const uname = response.username;
    const avatarURL = response.avatarURL;
    const resultHolder = document.getElementById("users_search_results");

    if (response.error && response.error === types.ErrorTypes.NOT_FOUND) return resultHolder.innerText = "User not found!";

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

    const url = `${apiURL}/profile`;

    const pfpUpload = document.getElementById("upload_pfp");
    const uploadButton = document.getElementById("upload");

    const pfp = pfpUpload.files[0];
    const formData = new FormData();
    formData.append("pfp", pfp);
    formData.append("username", updateUsername.value);
    formData.append("color", updateColor.value);

    pfpUpload.addEventListener("change", e => {
        document.getElementById("avatar").src = URL.createObjectURL(pfp);
    });

    const { response, status } = await fetchData(url, "PUT", formData);
    if (status !== 200) return HandleErrors(status);

    const updatedUsername = response.updatedUser.username;
    const updatedColor = response.updatedUser.color;
    const updatedAvatarURL = response.updatedUser.avatarURL;

    const avatar = document.getElementById("avatar");
    avatar.src = updatedAvatarURL;
    updateUsername.value = updatedUsername;
    updateColor.value = updatedColor;

    window.sessionStorage.setItem("user", JSON.stringify(response.updatedUser));
    document.getElementById("success_notif").innerText = "Updated successfully";
    
    location = "/@me";
}

export function UpdateUserdetails(user) {
    const profilePfp = document.getElementById("profile_pfp");
    const colorInNav = document.getElementById("profile_color");

    const profilePagePfp = document.getElementById("avatar");
    const profilePageUsername = document.getElementById("profile_username");
    const profilePageColor = document.getElementById("profile_color");
    const prefColorSel = document.getElementById("color_pref_selected");
    
    const updatedUsername = user.username;
    const updatedColor = user.color;
    const updatedPfp = user.avatarURL;

    const image = new Image();
    image.src = updatedPfp;
    profilePfp.appendChild(image);

    colorInNav.value = updatedColor;
    colorInNav.addEventListener("change", e => {
        prefColorSel.value = colorInNav.value;
    });
    prefColorSel.value = updatedColor;
    prefColorSel.addEventListener("change", e => {
        colorInNav.value = prefColorSel.value;
    });

    profilePagePfp.src = updatedPfp;
    profilePageUsername.value = updatedUsername;
    profilePageColor.value = updatedColor;
}

export async function AddUserToChannel(channelId, username, params) {
    let loggedUser = JSON.parse(window.sessionStorage.getItem("user"));
    const apiURL = params.apiURL;
    let socket = params.socket;

    const url = `${apiURL}/add_user?channel_id=${channelId._id}&username=${username}`;
    const { response, status } = await fetchData(url);
    if (status !== 200) return HandleErrors(status);
    if (response.error === types.ErrorTypes.ALREADY_EXISTs) return SendNotification("User already exist!", types.SuccessTypes.FAILED);
    SendNotification("Added " + username + " to this channel successfully 😎", types.SuccessTypes.SUCCESS);
    socket.emit("USER_INVITE", username, loggedUser);
}