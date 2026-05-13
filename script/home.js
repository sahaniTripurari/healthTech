// ═══════════════════════════════════════════════════════════
//  CANVAS — AI Sphere  (runs immediately, no DOM needed)
// ═══════════════════════════════════════════════════════════
const canvas = document.getElementById("aiCanvas");
const ctx    = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const cx = () => canvas.width  / 2;
const cy = () => canvas.height / 2;

const sphereRadius  = 150;
const particleCount = 900;
let   rotation      = 0;
let   mouse         = { x: null, y: null };

class Particle {
  constructor() {
    const u = Math.random();
    const v = Math.random();
    this.theta     = 2 * Math.PI * u;
    this.phi       = Math.acos(2 * v - 1);
    this.baseTheta = this.theta;
    this.basePhi   = this.phi;
    this.size      = 0.8 + Math.random() * 0.6;
  }
  project() {
    const x = sphereRadius * Math.sin(this.phi) * Math.cos(this.theta + rotation);
    const y = sphereRadius * Math.cos(this.phi);
    const z = sphereRadius * Math.sin(this.phi) * Math.sin(this.theta + rotation);
    this.px    = cx() + x;
    this.py    = cy() + y;
    this.alpha = 0.6 + (z / sphereRadius) * 0.4;
  }
  update() {
    if (mouse.x !== null) {
      const dx   = this.px - mouse.x;
      const dy   = this.py - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90) { this.theta += dx * 0.00025; this.phi += dy * 0.00025; }
    }
    this.theta += (this.baseTheta - this.theta) * 0.02;
    this.phi   += (this.basePhi   - this.phi)   * 0.02;
  }
  draw() {
    ctx.fillStyle = `rgba(30,178,166,${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.px, this.py, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const particles = [];
for (let i = 0; i < particleCount; i++) particles.push(new Particle());

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rotation += 0.0012;
  particles.forEach(p => { p.project(); p.update(); p.draw(); });
  requestAnimationFrame(animate);
})();

window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener("touchmove", e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; });
window.addEventListener("mouseout",  () => { mouse.x = null; });


// ═══════════════════════════════════════════════════════════
//  ALL DOM CODE — safely inside DOMContentLoaded
// ═══════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

  // ── Scroll Reveal ──────────────────────────────────────
  const revealEls = document.querySelectorAll(".home-card, .home-step");
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.2 });

  revealEls.forEach(el => {
    el.style.opacity    = "0";
    el.style.transform  = "translateY(40px)";
    el.style.transition = "all 0.8s ease";
    revealObs.observe(el);
  });


  // ── Hamburger / Mobile drawer ──────────────────────────
  const nav     = document.getElementById("navLinks");
  const burger  = document.getElementById("hamburger");
  const overlay = document.getElementById("overlay");

  burger?.addEventListener("click", () => {
    nav.classList.toggle("show");
    burger.classList.toggle("active");
    overlay?.classList.toggle("show");
  });

  overlay?.addEventListener("click", () => {
    nav.classList.remove("show");
    burger?.classList.remove("active");
    overlay.classList.remove("show");
  });


  // ── Page Switch (SPA navigation) ──────────────────────
  window.showPage = function(pageId) {
    const target = document.getElementById(pageId);
    if (!target) return;

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    target.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("data-page") === pageId) {
        link.classList.add("active");
      }
    });

    nav?.classList.remove("show");
    burger?.classList.remove("active");
    overlay?.classList.remove("show");
  };

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("data-page");
      if (page) window.showPage(page);
    });
  });


  // ── Auth Card ─────────────────────────────────────────
  const authCard     = document.getElementById("authCard");
  const loginBtn     = document.getElementById("loginBtn");
  const closeAuth    = document.getElementById("closeAuth");
  const goRegister   = document.getElementById("goRegister");
  const goLogin      = document.getElementById("goLogin");
  const loginForm    = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const navAuth      = document.getElementById("navAuth");

  loginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    authCard?.classList.add("active");
  });

  closeAuth?.addEventListener("click", () => authCard?.classList.remove("active"));

  document.addEventListener("click", (e) => {
    if (
      authCard?.classList.contains("active") &&
      !authCard.contains(e.target) &&
      e.target !== loginBtn
    ) {
      authCard.classList.remove("active");
    }
  });

  goRegister?.addEventListener("click", () => {
    loginForm.style.display    = "none";
    registerForm.style.display = "block";
  });
  goLogin?.addEventListener("click", () => {
    registerForm.style.display = "none";
    loginForm.style.display    = "block";
  });

  // LOGIN
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        location.reload();
      } else {
        showAuthMsg(data.message || "Login failed. Check your credentials.", "error");
      }
    } catch {
      showAuthMsg("Network error — is the server running?", "error");
    }
  });

  // REGISTER
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("regName").value.trim();
    const email    = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    try {
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        showAuthMsg("Account created! Please sign in.", "success");
        setTimeout(() => {
          registerForm.style.display = "none";
          loginForm.style.display    = "block";
        }, 1200);
      } else {
        showAuthMsg(data.message || "Registration failed.", "error");
      }
    } catch {
      showAuthMsg("Network error — is the server running?", "error");
    }
  });

  function showAuthMsg(msg, type) {
    let el = document.getElementById("authMsg");
    if (!el) {
      el = document.createElement("p");
      el.id = "authMsg";
      el.style.cssText = "margin:8px 0;font-size:13px;padding:8px 12px;border-radius:6px;text-align:center;";
      authCard?.appendChild(el);
    }
    el.textContent      = msg;
    el.style.background = type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)";
    el.style.color      = type === "error" ? "#f87171"               : "#34d399";
    el.style.display    = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  }


  // ── Init User ────────────────────────────────────────
  async function initUser() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) { localStorage.removeItem("token"); return; }
      const user = await res.json();

      if (navAuth) {
        navAuth.innerHTML = `
          <span style="color:rgba(255,255,255,0.75);font-size:14px;white-space:nowrap;">
            Hello, ${user.fullName.split(" ")[0]}
          </span>
          <div id="navbarAvatar"
               style="width:38px;height:38px;border-radius:50%;cursor:pointer;
                      border:2px solid #00d4ff;flex-shrink:0;overflow:hidden;
                      ${user.profileImage
                        ? `background:url('${user.profileImage}') center/cover;`
                        : `background:#1e6e7e;display:flex;align-items:center;
                           justify-content:center;color:#fff;font-weight:700;font-size:16px;`}">
            ${!user.profileImage ? (user.fullName?.charAt(0).toUpperCase() || "?") : ""}
          </div>`;
        document.getElementById("navbarAvatar")
          ?.addEventListener("click", () => openProfile(user));
      }
    } catch { /* silently ignore */ }
  }
  initUser();


  // ── Profile Drawer ───────────────────────────────────
  const profileDrawer  = document.getElementById("profileDrawer");
  const profileOverlay = document.getElementById("profileOverlay");
  const saveBtn        = document.getElementById("drawerSaveProfileBtn");
  const logoutBtn      = document.getElementById("logoutBtn");

  function openProfile(user) {
    profileDrawer?.classList.add("active");
    profileOverlay?.classList.add("active");

    document.getElementById("drawerProfileName").textContent = user.fullName;
    document.getElementById("profileId").textContent   = user._id;

    const avatar = document.getElementById("profileAvatar");
    if (avatar) {
      avatar.src = user.profileImage
        ? user.profileImage
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1e6e7e&color=fff&size=120`;
    }

    document.getElementById("displayName").value  = user.fullName;
    document.getElementById("displayEmail").value = user.email;
    document.getElementById("createdAt").value    = new Date(user.createdAt).toLocaleDateString();
    document.getElementById("editName").value     = user.fullName;
    document.getElementById("editEmail").value    = user.email;
    document.getElementById("oldPassword").value  = "";
    document.getElementById("editPassword").value = "";
  }

  profileOverlay?.addEventListener("click", () => {
    profileOverlay.classList.remove("active");
    profileDrawer?.classList.remove("active");
  });
  profileDrawer?.addEventListener("click", e => e.stopPropagation());

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("token");
    profileDrawer?.classList.remove("active");
    profileOverlay?.classList.remove("active");
    location.reload();
  });

  saveBtn?.addEventListener("click", async () => {
    const token       = localStorage.getItem("token");
    const fullName    = document.getElementById("editName").value.trim();
    const email       = document.getElementById("editEmail").value.trim();
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("editPassword").value;

    if (newPassword && !oldPassword) {
      showProfileMsg("⚠️ Purana password daalo naya set karne ke liye.", "error");
      return;
    }

    const payload = { fullName, email };
    if (oldPassword && newPassword) {
      payload.oldPassword = oldPassword;
      payload.newPassword = newPassword;
    }

    try {
      const res  = await fetch("/api/user/profile", {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        showProfileMsg("❌ " + (data.message || "Update failed."), "error");
        return;
      }

      showProfileMsg("✅ Profile updated successfully!", "success");
      document.getElementById("oldPassword").value  = "";
      document.getElementById("editPassword").value = "";

      if (data.forceLogout) {
        setTimeout(() => { localStorage.removeItem("token"); location.reload(); }, 1500);
      } else {
        setTimeout(() => location.reload(), 1200);
      }
    } catch {
      showProfileMsg("❌ Network error. Please try again.", "error");
    }
  });

  function showProfileMsg(msg, type) {
    let el = document.getElementById("profileSaveMsg");
    if (!el) {
      el = document.createElement("p");
      el.id = "profileSaveMsg";
      el.style.cssText =
        "margin-top:10px;font-size:14px;border-radius:6px;padding:8px 12px;text-align:center;";
      saveBtn?.insertAdjacentElement("afterend", el);
    }
    el.textContent      = msg;
    el.style.background = type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)";
    el.style.color      = type === "error" ? "#f87171"               : "#34d399";
    el.style.display    = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  }


  // ── Profile Photo Upload ─────────────────────────────
  const photoInput = document.getElementById("photoInput");

  photoInput?.addEventListener("change", async () => {
    const file = photoInput.files[0];
    if (!file) return;

    const token    = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("profileImage", file);

    const avatar = document.getElementById("profileAvatar");
    if (avatar) avatar.src = URL.createObjectURL(file);

    try {
      const res  = await fetch("/api/user/profile-image", {
        method:  "POST",
        headers: { Authorization: "Bearer " + token },
        body:    formData
      });
      const data = await res.json();

      if (!res.ok) { showProfileMsg("❌ " + (data.message || "Upload failed"), "error"); return; }

      const navAvatar = document.getElementById("navbarAvatar");
      if (navAvatar) {
        navAvatar.style.background     = `url('${data.profileImage}') center/cover`;
        navAvatar.textContent          = "";
      }
      showProfileMsg("✅ Photo updated!", "success");
    } catch {
      showProfileMsg("❌ Upload failed. Try again.", "error");
    }
  });

}); // end DOMContentLoaded
function googleLogin() {
  window.location.href = "http://localhost:5000/api/auth/google";
}