export function ValidatePassword(password, user) {
    fetch(
        "/ValidatePassword",
        {
            mode: "cors",
            method: "POST",
            body: new Blob([JSON.stringify({ password: password })], {
                type: "application/json",
            }),
        },
    )
        .then(async (response) => {
            if (response.ok) return await response.json();
        })
        .then((response) => {
            if (response.isValid) {
                // Validating password with simple rules (8 characters long with a number, a lowercase and an uppercase character)
                SignUpUser(user); // SignUpUser() method imported from "./ChatterBox/Message.js"
                document.getElementById("invalid_credentials").style.display = "none"; // Remove the warning which tells about the validation rules for the password
            } else {
                // if the password didn't pass the validation show the rules!
                document.getElementById("invalid_credentials").innerText =
                    "Password must be at least 8 characters long and should contain a number, lowercase characters and uppercase characters";
                document.getElementById("invalid_credentials").style.display = "block";
            }
        });
}

async function SignUpUser(user) {    
    await fetch(
        "http://localhost:3001/api/signup",
        {
            method: "POST",
            mode: "cors",
            body: new Blob([JSON.stringify(user)], {
                type: "application/json",
            }),
        },
    )
        .then(async (response) => {
            if (response.ok) return response.json();
        })
        .then((response) => {
            if (response.success) {
                alert("User successfully created!");
            }
            else if (
                !response.success &&
                response.message === "Username already exists"
            )
                alert("username already exits!");
        });
}