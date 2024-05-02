const loading = document.getElementById("loading")

window.onload = () => {
    loading.style.display = "none"

    const wrapper = document.getElementById("wrapper")
    const nav = document.getElementById("navigation")
    wrapper.addEventListener("scroll", scroll => {
        wrapper.scrollTop > 0 ? nav.classList.replace("attop", "nattop") : nav.classList.replace("nattop", "attop")
    })
}