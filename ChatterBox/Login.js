let token = null
let refreshToken = null
let loggedUser = null

export async function LoginUser(user) {
    await fetch(
        "http://localhost:3001/api/login",
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
            alert("something went wrong! Please reload the site and relogin")
        })
        .then(async (response) => {
            if (response.token) {
                token = response.token;
                refreshToken = response.refreshToken
                loggedUser = response.user.username;
                window.sessionStorage.setItem("token", token)
                window.sessionStorage.setItem("refresh token", refreshToken)
                window.sessionStorage.setItem("user", JSON.stringify(response.user))
                window.location = "/@me"
            } else {
                document.getElementById("invalid_credentials").innerText =
                    "Username or Password is incorrect!";
                document.getElementById("invalid_credentials").style = "";
            }
        });
}