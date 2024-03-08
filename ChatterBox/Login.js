let token = null
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
        })
        .then(async (response) => {
            if ((await response.CorrectCredentials) && response.token) {
                token = response.token;
                loggedUser = response.user.username;
                window.sessionStorage.setItem("token", token)
                window.sessionStorage.setItem("user", JSON.stringify(response.user))
                // socket.emit("LOGIN", response);
                window.location = "http://localhost:3000/@me"
            } else {
                document.getElementById("invalid_credentials").innerText =
                    "Username or Password is incorrect!";
                document.getElementById("invalid_credentials").style.display = "block";
            }
        });
}