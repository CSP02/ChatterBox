import HandleErrors from "../handlers/errorHandler.js";

let token = null;
let refreshToken = null;
let loggedUser = null;

export async function LoginUser(user) {
    await fetch(
        "https://chatter-box-api-pi.vercel.app/api/login",
        {
            method: "POST",
            mode: "cors",
            body: new Blob([JSON.stringify(user)], {
                type: "application/json",
            }),
        },
    )
        .then(async (response) => {
            if (response.ok) return await response.json();
            HandleErrors(response.status);
        })
        .then(async (response) => {
            if (response.token) {
                token = response.token;
                refreshToken = response.refreshToken;
                loggedUser = response.user.username;
                window.sessionStorage.setItem("token", token);
                window.sessionStorage.setItem("refresh token", refreshToken);
                window.sessionStorage.setItem("user", JSON.stringify(response.user));
                window.location = "https://chatter-box-indol.vercel.app/@me/index.html";
            } else {
                document.getElementById("invalid_credentials").innerText =
                    "Username or Password is incorrect!";
                document.getElementById("invalid_credentials").style = "";
            }
        });
}