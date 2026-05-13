// Scroll Reveal for About
document.addEventListener("scroll", () => {
  document.querySelectorAll("#about .card-section").forEach(section => {
    const top = section.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      section.classList.add("show");
    }
  });
});