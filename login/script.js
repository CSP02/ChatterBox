/**
 * ? Imports from other scripts
 */
import { LoginUser } from "../ChatterBox/Login.js"

/**
 * ? Defining document elements
 */

const login = document.getElementById("login_button")

/**
 * ? Adding an event listener for login button
 */
login.addEventListener("click", async (event) => {
    // Getting username and password from the input fields
    const username = document.getElementById("username_box")
    const password = document.getElementById("password_box")

    // Creating user object
    const user = {
        username: username.value,
        password: password.value,
    }
    LoginUser(user) // LoginUser() method is imported from "./ChatterBox/Message.js" file.
})

window.onload = () => {
    document.getElementById("loading").style.display = "none"
}