import Types from "./types.js";
const types = new Types()

export function ValidatePassword(password, user) {
    fetch("/ValidatePassword", {
        mode: "cors",
        method: "POST",
        body: new Blob([JSON.stringify({ password: password })], {
            type: "application/json",
        }),
    }).then(async (response) => {
        if (response.ok) return await response.json();
    }).then((response) => {
        if (response.isValid) {
            // Validating password with simple rules (8 characters long with a number, a lowercase and an uppercase character)
            SignUpUser(user); // SignUpUser() method imported from "./ChatterBox/Message.js"
        } else {
            // if the password didn't pass the validation show the rules!
            alert("Password must be at\n1. At least 8 characters long\n2. should contain a number, lowercase characters and uppercase characters");
        }
    });
}

async function SignUpUser(user) {
    await fetch("http://localhost:3001/api/signup", {
        method: "POST",
        mode: "cors",
        body: new Blob([JSON.stringify(user)], {
            type: "application/json",
        }),
    }).then(async (response) => {
        if (response.ok) return response.json();
    }).then((response) => {
        if (response.error === types.ErrorTypes.USER_ALREADY_EXIST)
            return alert("username already exits!");
        location = "/login"
    });
}