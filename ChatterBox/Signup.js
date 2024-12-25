import Types from "./types.js";
const types = new Types();

export async function ValidatePassword() {
    const password = document.getElementById("password_box").value;

    await fetch("/ValidatePassword", {
        mode: "cors",
        method: "POST",
        body: new Blob([JSON.stringify({ password: password })], {
            type: "application/json",
        }),
    }).then(async (response) => {
        if (response.ok) return await response.json();
    }).then(async (response) => {
        if (response.isValid) {
            // Validating password with simple rules (8 characters long with a number, a lowercase and an uppercase character)
            await SignUpUser(); // SignUpUser() method imported from "./ChatterBox/Message.js"
        } else {
            // if the password didn't pass the validation show the rules!
            alert("Password must be at\n1. At least 8 characters long\n2. should contain a number, lowercase characters and uppercase characters");
        }
    });
}

async function SignUpUser() {
    // Getting all the required values (username, password, color)
    const username = document.getElementById("username_box").value;
    const password = document.getElementById("password_box").value;
    const color = document.getElementById("profile_color").value;
    const newPfp = document.getElementById("update_new_pfp");

    const formData = new FormData();
    formData.append("username", username.toString());
    formData.append("password", password.toString());
    formData.append("color", color.toString());
    formData.append("avatarURL", newPfp.files[0]);

    await fetch("http://localhost:3001/api/signup", {
        method: "POST",
        mode: "cors",
        body: formData
    }).then(async (response) => {
        if (response.ok) return response.json();
    }).then((response) => {
        if (!response.error)
            location = "/login";
    });
}