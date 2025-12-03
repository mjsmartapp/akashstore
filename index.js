// index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------- FIREBASE CONFIG ---------- */

const firebaseConfig = {
  apiKey: "AIzaSyCu_WUd66NRLa_8uI06UXVTlkDh74dMBqU",
  authDomain: "vasanth-ee54c.firebaseapp.com",
  databaseURL: "https://vasanth-ee54c-default-rtdb.firebaseio.com",
  projectId: "vasanth-ee54c",
  storageBucket: "vasanth-ee54c.firebasestorage.app",
  messagingSenderId: "668556425496",
  appId: "1:668556425496:web:1b3aab6bf95a5baa19c66d",
  measurementId: "G-8R23976J89",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

/* ---------- DOM ELEMENTS ---------- */

const loginButtons = document.querySelectorAll("[data-login-btn]");
const mainAuthBtn = document.querySelector(".nav-auth-btn");
const mainAuthLabel = mainAuthBtn?.querySelector(".btn-label");

const userPill = document.querySelector("[data-user-pill]");
const userNameEl = document.querySelector("[data-user-name]");
const userAvatarEl = document.querySelector("[data-user-avatar]");

const backdrop = document.querySelector("[data-auth-backdrop]");
const closeBtn = document.querySelector("[data-auth-close]");
const statusArea = document.querySelector("[data-auth-status]");

const tabButtons = document.querySelectorAll("[data-auth-tab]");
const panels = document.querySelectorAll("[data-auth-panel]");
const authTitleEl = document.querySelector("[data-auth-title]");
const authSubtitleEl = document.querySelector("[data-auth-subtitle]");
const authPillEl = document.querySelector("[data-auth-pill]");

const googleButtons = document.querySelectorAll("[data-google-btn]");

const loginForm = document.querySelector("[data-login-form]");
const loginEmailInput = document.querySelector("[data-login-email]");
const loginPasswordInput = document.querySelector("[data-login-password]");
const loginSubmitBtn = document.querySelector("[data-login-submit]");

const registerForm = document.querySelector("[data-register-form]");
const regNameInput = document.querySelector("[data-register-name]");
const regPhoneInput = document.querySelector("[data-register-phone]");
const regAddressInput = document.querySelector("[data-register-address]");
const regEmailInput = document.querySelector("[data-register-email]");
const regPasswordInput = document.querySelector("[data-register-password]");
const registerSubmitBtn = document.querySelector("[data-register-submit]");

/* ---------- HELPERS ---------- */

const getCurrentMode = () => {
  const active = document.querySelector(".auth-tab.auth-tab-active");
  return active ? active.dataset.authTab : "login";
};

const openModal = (mode = "login") => {
  if (!backdrop) return;
  backdrop.classList.remove("hidden");
  switchMode(mode);
};

const closeModal = () => {
  if (!backdrop) return;
  backdrop.classList.add("hidden");
  showStatus("");
  loginForm?.reset();
  registerForm?.reset();
};

const showStatus = (message, type = "error") => {
  if (!statusArea) return;
  statusArea.textContent = message;
  statusArea.classList.remove("error", "success");
  if (message) statusArea.classList.add(type);
};

const switchMode = (mode) => {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("auth-tab-active", btn.dataset.authTab === mode);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.authPanel !== mode);
  });

  if (mode === "login") {
    authPillEl.textContent = "Welcome back";
    authTitleEl.textContent = "Sign in to your dry-fruit haven";
    authSubtitleEl.textContent =
      "Track orders, earn points and unlock members-only drops.";
  } else {
    authPillEl.textContent = "New here?";
    authTitleEl.textContent = "Create your snack profile";
    authSubtitleEl.textContent =
      "Save your addresses, favourite mixes and get personalised offers.";
  }

  googleButtons.forEach((btn) => {
    const label = btn.querySelector(".google-label");
    if (label) {
      label.textContent =
        mode === "register" ? "Sign up with Google" : "Continue with Google";
    }
  });

  showStatus("");
};

const setGoogleButtonsLoading = (isLoading) => {
  googleButtons.forEach((btn) => {
    const label = btn.querySelector(".google-label");
    if (!label) return;

    if (isLoading) {
      btn.classList.add("disabled");
      btn.disabled = true;
      label.dataset.prev = label.textContent;
      label.textContent = "Connecting to Google…";
    } else {
      btn.classList.remove("disabled");
      btn.disabled = false;
      label.textContent =
        label.dataset.prev ||
        (getCurrentMode() === "register"
          ? "Sign up with Google"
          : "Continue with Google");
    }
  });
};

const setButtonLoading = (btn, text) => {
  if (!btn) return;
  btn.dataset.prevText = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
};

const clearButtonLoading = (btn) => {
  if (!btn) return;
  btn.textContent = btn.dataset.prevText || btn.textContent;
  btn.disabled = false;
};

/* ---------- OPEN/CLOSE MODAL & NAV BUTTON ---------- */

// All buttons with data-login-btn open login modal,
// except navbar button when user is logged in (then it logs out).
loginButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (auth.currentUser && btn.classList.contains("nav-auth-btn")) {
      // Logout flow
      try {
        await signOut(auth);
        showStatus("You have been logged out.", "success");
      } catch (err) {
        console.error("Logout error:", err);
        showStatus("Could not log you out. Please try again.", "error");
      }
      return;
    }

    openModal("login");
  });
});

closeBtn?.addEventListener("click", closeModal);

backdrop?.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && backdrop && !backdrop.classList.contains("hidden")) {
    closeModal();
  }
});

/* ---------- TABS ---------- */

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchMode(btn.dataset.authTab);
  });
});

/* ---------- GOOGLE SIGN-IN ---------- */

googleButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      setGoogleButtonsLoading(true);
      showStatus("");

      await signInWithPopup(auth, provider);

      const mode = getCurrentMode();
      showStatus(
        mode === "register"
          ? "Account created and signed in with Google."
          : "Signed in successfully with Google.",
        "success"
      );

      setGoogleButtonsLoading(false);
      setTimeout(closeModal, 650);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setGoogleButtonsLoading(false);

      let msg =
        "Something went wrong while connecting to Google. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        msg = "Sign-in popup was closed before completing. Please try again.";
      } else if (error.code === "auth/network-request-failed") {
        msg = "Network error. Check your connection and try again.";
      }

      showStatus(msg, "error");
    }
  });
});

/* ---------- EMAIL LOGIN ---------- */

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    showStatus("Please enter email and password.", "error");
    return;
  }

  try {
    setButtonLoading(loginSubmitBtn, "Logging in…");
    showStatus("");

    await signInWithEmailAndPassword(auth, email, password);

    clearButtonLoading(loginSubmitBtn);
    showStatus("Logged in successfully. Welcome back!", "success");
    setTimeout(closeModal, 650);
  } catch (error) {
    console.error("Login error:", error);
    clearButtonLoading(loginSubmitBtn);

    let msg = "Unable to log you in. Please check your details.";
    if (error.code === "auth/user-not-found") {
      msg = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      msg = "Incorrect password. Please try again.";
    } else if (error.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    }
    showStatus(msg, "error");
  }
});

/* ---------- EMAIL REGISTER ---------- */

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = regNameInput.value.trim();
  const phone = regPhoneInput.value.trim();
  const address = regAddressInput.value.trim();
  const email = regEmailInput.value.trim();
  const password = regPasswordInput.value;

  if (!name || !phone || !address || !email || !password) {
    showStatus("Please fill in all fields.", "error");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    showStatus("Phone number must be exactly 10 digits.", "error");
    return;
  }

  try {
    setButtonLoading(registerSubmitBtn, "Creating account…");
    showStatus("");

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    try {
      await updateProfile(user, { displayName: name });
    } catch (err) {
      console.warn("Profile update failed:", err);
    }

    try {
      await set(ref(db, "users/" + user.uid), {
        name,
        phone,
        address,
        email,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.warn("Saving user data failed:", err);
    }

    clearButtonLoading(registerSubmitBtn);
    showStatus("Account created successfully. Welcome to Royal Dry Fruits!", "success");
    setTimeout(closeModal, 650);
  } catch (error) {
    console.error("Register error:", error);
    clearButtonLoading(registerSubmitBtn);

    let msg = "Could not create your account. Please try again.";
    if (error.code === "auth/email-already-in-use") {
      msg = "An account with this email already exists.";
    } else if (error.code === "auth/invalid-email") {
      msg = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      msg = "Password should be at least 6 characters.";
    }

    showStatus(msg, "error");
  }
});

/* ---------- AUTH STATE (SIGN IN / OUT UI) ---------- */

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Navbar button text -> Logout
    if (mainAuthLabel) mainAuthLabel.textContent = "Logout";

    // Show user pill
    if (userPill && userNameEl && userAvatarEl) {
      userPill.classList.remove("hidden");
      userNameEl.textContent = user.displayName || user.email || "Dry Fruit Lover";

      const photoURL =
        user.photoURL ||
        "https://api.dicebear.com/7.x/thumbs/svg?seed=dryfruit&backgroundColor=b6e3f4";
      userAvatarEl.src = photoURL;
      userAvatarEl.alt = user.displayName || "User avatar";
    }
  } else {
    if (mainAuthLabel) mainAuthLabel.textContent = "Sign in";
    userPill?.classList.add("hidden");
  }
});

/* ---------- LOGOUT VIA USER PILL ---------- */

userPill?.addEventListener("click", async () => {
  if (!auth.currentUser) return;
  try {
    await signOut(auth);
    showStatus("You have been logged out.", "success");
  } catch (error) {
    console.error("Sign-out error:", error);
    showStatus("Could not log you out. Please try again.", "error");
  }
});
