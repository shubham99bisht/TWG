import { getDatabase, set, ref } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { app, PAGES } from "./index.js";
import { getEncodedKey, getToken } from "./totp.js";

const db = getDatabase(app);

const user_email = document.getElementById("user_email")

window.resendVerificationLink = async () => {
  await sendEmailVerification(auth.currentUser);
  verify_success_alert.classList.remove("d-none")
  verify_error_alert.classList.add("d-none")
}

// Check if email is verified
window.isEmailVerified = async () => {
  const user = auth.currentUser;
  user_email.innerHTML = user.email;
  const emailVerified = user.emailVerified;
  if (!emailVerified) {
    verify_success_alert.classList.add("d-none")
    verify_error_alert.classList.remove("d-none")
  } else {
    document.getElementById("verifyEmail").classList.add("d-none");
    document.getElementById("OptInTwoFactor").classList.remove("d-none");
  }
}
setTimeout(isEmailVerified, 1000)

// Show QR Code
window.generateQRCode = () => {
  document.getElementById("OptInTwoFactor").classList.add("d-none");
  document.getElementById("QRCode").classList.remove("d-none");

  const userId = auth.currentUser.uid;
  const base32Encoded = getEncodedKey(userId);
  const prefix = 'otpauth://totp/defi_patrol?secret='

  document.getElementById("qrCode").src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${prefix}${base32Encoded}`
}

// Confirm Two Factor OTP
const verifyTOTP = document.getElementById("verifyTOTP");
if (verifyTOTP) {
  verifyTOTP.addEventListener("submit", confirmTwoFactor)
}
async function confirmTwoFactor(event) {
  event.preventDefault();
  const formProps = new FormData(event.target);
  const formData = Object.fromEntries(formProps);
  const { totp } = formData;

  const userId = auth.currentUser.uid;
  const base32Encoded = getEncodedKey(userId);
  const token = getToken(base32Encoded);

  if (token === totp) {
    await set(ref(db, `${userId}/settings`), { dualFactorAuth: true })
    localStorage.setItem("isLoggedIn", true)
    location.pathname = PAGES.HOME_PAGE
  } else {
    totp_error_alert.classList.remove("d-none")
  }
}

// Skip Two Factor
window.skipTwoFactor = async () => {
  const userId = auth.currentUser.uid;
  processingMessage();
  await set(ref(db, `${userId}/settings`), { dualFactorAuth: false });
  location.pathname = PAGES.HOME_PAGE
}

// Click on Back Button
const elements = document.getElementsByClassName("backBtn")
for(let i = 0; i < elements.length; i++) {
  elements[i].addEventListener("click", async (event) => {
    console.log(event)
    await logOut();
    location.pathname = PAGES.LOGIN_PAGE
  })
}