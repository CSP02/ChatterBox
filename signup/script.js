/**
 * ? Imports from other scripts
 */
import { ValidatePassword } from "../ChatterBox/Signup.js"
import { HandleSocketEvents } from "../handlers/socketHandler.js"

/**
 * ? Handle the socket events like "MESSAGES", "LOGIN", etc.
 */
HandleSocketEvents()

/**
 * ? Defining document elements
 */

const signup = document.getElementById("signup_button")
const loading = document.getElementById("loading")
const prefColor = document.getElementById("pref_color")
const profileColor = document.getElementById("profile_color")

window.onload = () => {
    document.getElementById("loading").style.display = "none"
    // Random color generator
    let randomColor = "#"
    let i = 0
    const letters = ['a', 'b', 'c', 'd', 'e', 'f']
    while(i < 6){
        if(Math.round(Math.random(0, 1)) === 0){
            randomColor += letters[Math.round(Math.random(0, 5))]
        }else{
            randomColor += Math.round(Math.random(0, 9))
        }
        i++
    }
    profileColor.value = randomColor
    prefColor.setAttribute("placeHolder", randomColor)
}
/**
 * ? Signup event listener for the signup button
 */
signup.addEventListener("click", async (event) => {
    // Getting all the required values (username, password, color)
    const username = document.getElementById("username_box")
    const password = document.getElementById("password_box")
    const color = document.getElementById("profile_color").value
    
    // Choosing a random pfp
    const randomPfp = Math.round(Math.random() * 10) > 5 ? Math.round(Math.random() * 10) - 5 : Math.round(Math.random() * 10)
    const avatarURL = `/default_pfps/defaultPFP_${randomPfp <= 0 ? 1 : randomPfp}.png`

    // Creating a user object which we pass to signup the user with the given details
    const user = {
        username: username.value,
        password: password.value,
        color: color,
        avatarURL: avatarURL
    }

    // Validate the user password
    ValidatePassword(password.value, user)
})

prefColor.addEventListener("keypress", event => {
    changeValue(profileColor, prefColor.value)
})

profileColor.addEventListener("change", event => {
    changeValue(prefColor, profileColor.value)
})

function changeValue(inputEl, value) {
    inputEl.value = value
}