import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
  
import { PAGES } from "./index.js";
import { getToken } from "./totp.js";

const auth = getAuth();
const dbRef = ref(getDatabase());
const ADMIN = "LH82LNF1vocIgADDlemRIORH4c72"

const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("loginBtn");
if (loginForm && loginBtn) {
  loginBtn.addEventListener("click", async function (event) {
    const formProps = new FormData(loginForm);
    const formData = Object.fromEntries(formProps);
    const login_error_alert = document.getElementById("login_error_alert")

    const { email, password } = formData;
    if (!email?.trim() || !password) {
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      if (user !== null) {
        handleLoginFlow();
      }
    } catch (error) {
      let errorMessage = 'An error occurred!';
  
      if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "User doesn't exist!";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password.';
      }

      if (login_error_alert) {
        login_error_alert.classList.remove("d-none")
        login_error_alert.innerHTML = errorMessage
      }
    }
  });
}

const totpForm = document.getElementById("totp-form");
const totpBtn = document.getElementById("totpBtn");
const totp_error_alert = document.getElementById("totp_error_alert")
if (totpForm && totpBtn) {
  totpBtn.addEventListener("click", async function (event) {
    const formProps = new FormData(totpForm);
    const formData = Object.fromEntries(formProps);

    const { totp } = formData;
    if (!totp) {
      totp_error_alert.innerHTML = "Please provide a valid T-OTP!";
      totp_error_alert.classList.remove("d-none")
    }

    try {
      const uid = auth.currentUser.uid;
      const token = getToken(base32.encode(uid).split("=")[0])
      if (token == totp) {
        localStorage.setItem("isLoggedIn", true);
        location.pathname = PAGES.HOME_PAGE;
      } else {
        totp_error_alert.innerHTML = "Incorrect Token!";
        totp_error_alert.classList.remove("d-none")
      }
    } catch (error) {
      totp_error_alert.innerHTML = "Login failed!";
      totp_error_alert.classList.remove("d-none")
    }
  });
}

// ------------------------
// Two Factor & Email Verification
// ------------------------
async function handleLoginFlow() {
  if (auth.currentUser) {
    // Check if User Email is Verified
    isEmailVerified()
    // Check if User has opted for Two Factor
    handleTwoFactor(auth.currentUser.uid)
  }
}

async function isEmailVerified() {
  const user = auth.currentUser;
  const emailVerified = user.emailVerified;
  if (!emailVerified) {
    location.pathname = PAGES.CONFIRM_PAGE;
  }  
}

async function handleTwoFactor(userId) {
  const userData = await get(child(dbRef, `${userId}/settings`));
  if (userData.exists()) {
    const data = userData.val();
    if (data.dualFactorAuth) {
      toggleTwoFactor()
      localStorage.setItem("isLoggedIn", false);
    } else {
      localStorage.setItem("isLoggedIn", true);
      location.pathname = PAGES.HOME_PAGE;
    }
  } else {
    location.pathname = PAGES.CONFIRM_PAGE;
  }
}

async function toggleTwoFactor() {
  document.getElementById("email-password-card").classList.toggle("d-none")
  document.getElementById("totp-card").classList.toggle("d-none")
}
