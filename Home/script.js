document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("nav");

    // Handle Navbar scroll effect
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }
    });

    // Simple interaction: reveal features on scroll
    const features = document.querySelectorAll(".feature");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    features.forEach(f => {
        f.style.opacity = "0";
        f.style.transform = "translateY(20px)";
        f.style.transition = "all 0.6s ease-out";
        observer.observe(f);
    });
});