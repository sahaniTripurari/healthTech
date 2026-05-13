// ✅ Ye code home.js ke TOP mein add karo (sabse pehle)
// Google OAuth callback se token URL mein aata hai — ise localStorage mein save karo

function handleGoogleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (token) {
    // Token save karo — baaki sab API calls isi se chalti hain
    localStorage.setItem("token", token);

    // URL clean karo — token URL mein dikhna nahi chahiye
    window.history.replaceState({}, document.title, "/#dashboard");

    // Dashboard page show karo
    showPage("dashboard");

    console.log("✅ Google login successful");
  }
}

// ✅ Ye function Google button pe click hone par call hoga
function googleLogin() {
  window.location.href = "/api/auth/google";
}

// Page load hote hi check karo
handleGoogleCallback();
