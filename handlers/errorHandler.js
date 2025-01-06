const errorNotif = document.getElementById("error_notif");

export default function HandleErrors(errorCode, error = null) {
    document.getElementById("loading").style.display = "none";
    errorNotif.style.display = "block";
    if (errorCode)
        switch (errorCode) {
            case 400:
                errorNotif.innerText = "Seems like the resource you are trying to find is not available or does not exist.";
                break;
            case 401:
                if (errorCode === 1) return location.reload();
                errorNotif.innerText = "You are not authorized to access this resource.";
                break;
            default:
                errorNotif.innerText = "!uh oh an error occured please refresh the page.";
                break;
        }

    setTimeout(() => {
        errorNotif.style.display = "none";
    }, 5000);
}