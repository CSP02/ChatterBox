/**
 * ? Imports from other scripts
 */
import { ValidatePassword } from "../ChatterBox/Signup.js";
let avatarURL = "/default_pfps/defaultPFP_1.png";

/**
 * ? Defining document elements
 */

const signup = document.getElementById("signup_button");
const loading = document.getElementById("loading");
const prefColor = document.getElementById("pref_color");
const profileColor = document.getElementById("profile_color");
const newPfpHolder = document.getElementById("new_pfp_holder");
const newPfp = document.getElementById("update_new_pfp");

window.onload = () => {
    loading.style.display = "none";
    // Random color generator
    let randomColor = "#";
    let i = 0;
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    while (i < 6) {
        if (Math.round(Math.random(0, 1)) === 0) {
            randomColor += letters[Math.round(Math.random(0, 5))];
        } else {
            randomColor += Math.round(Math.random(0, 9));
        }
        i++;
    }
    profileColor.value = randomColor;
    prefColor.setAttribute("placeHolder", randomColor);

    newPfpHolder.addEventListener("click", click => {
        newPfp.click();
    });

    newPfp.addEventListener("change", e => {
        const image = newPfp.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            document.getElementById("new_pfp").src = e.target.result;
        };

        reader.readAsDataURL(image);
        // document.getElementById("new_pfp").src = newPfp.files[0];
    })
}
/**
 * ? Signup event listener for the signup button
 */
signup.addEventListener("click", async (event) => {
    // Validate the user password
    ValidatePassword();
})

prefColor.addEventListener("keypress", event => {
    changeValue(profileColor, prefColor.value);
})

profileColor.addEventListener("change", event => {
    changeValue(prefColor, profileColor.value);
})

function changeValue(inputEl, value) {
    inputEl.value = value;
}