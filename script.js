// ----- Subtle scroll reveal (clean + readable) -----
const revealEls = document.querySelectorAll(".reveal");

const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }
  },
  { threshold: 0.12 }
);

revealEls.forEach((el) => io.observe(el));

// ----- Year in footer -----
document.getElementById("year").textContent = new Date().getFullYear();

// ----- Contact form (Web3Forms) -----
const contactForm = document.getElementById("contact-form");
const contactSubmit = document.getElementById("contact-submit");
const contactResult = document.getElementById("contact-result");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  contactSubmit.disabled = true;
  contactSubmit.textContent = "Sending…";
  contactResult.style.display = "none";

  const data = new FormData(contactForm);

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: data,
    });
    const json = await res.json();

    if (res.ok && json.success) {
      contactResult.textContent = "✓ Message sent! I'll get back to you soon.";
      contactResult.style.color = "var(--neon)";
      contactForm.reset();
    } else {
      throw new Error(json.message || "Submission failed.");
    }
  } catch (err) {
    contactResult.textContent = "✗ Something went wrong. Please try emailing me directly.";
    contactResult.style.color = "#ff4d4d";
  } finally {
    contactResult.style.display = "block";
    contactSubmit.disabled = false;
    contactSubmit.textContent = "Send";
  }
});
