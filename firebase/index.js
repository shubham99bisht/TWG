import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCAfeYDV4O4mCtRYWuLhO0aIofDt7GMSV4",
  authDomain: "defipatrol-c0d11.firebaseapp.com",
  databaseURL: "https://defipatrol-c0d11-default-rtdb.firebaseio.com",
  projectId: "defipatrol-c0d11",
  storageBucket: "defipatrol-c0d11.appspot.com",
  messagingSenderId: "1021045641034",
  appId: "1:1021045641034:web:8ba3dbbd92aa8c86e63bb3"
};
export const app = initializeApp(firebaseConfig);
const auth = getAuth();
window.auth = auth;

export const PAGES = {
  HOME_PAGE: 'index.html',
  LOGIN_PAGE: '../auth/login.html',
  CONFIRM_PAGE: '../auth/confirm-mail.html',
  AUTH_PAGES_PREFIX: '/auth',
}


// ------------------------
// OnAuthStateChange
// ------------------------
onAuthStateChanged(auth, async (user) => {
  const currentPage = location.pathname;
  const isAuthPage = currentPage.includes(PAGES.AUTH_PAGES_PREFIX)
  const isLoggedIn = JSON.parse(localStorage.getItem("isLoggedIn"));
  const preloader = document.querySelector('#preloader');

  // Handle Auth Pages
  if (isAuthPage) {
    if (currentPage.includes('action')) return
    if (user && isLoggedIn) { location.pathname = PAGES.HOME_PAGE; }
    if (currentPage.includes('login')) {}
    else if (currentPage.includes('register')) {}
    else if (currentPage.includes('forget-password')) {}
    else if (currentPage.includes('confirm-mail')) {
      if (!user) location.pathname = PAGES.LOGIN_PAGE;
    }
  }
  // If logged in, load profile config and redirect to home page
  else if (user && isLoggedIn) {
    const theme = localStorage.getItem('darkMode');
    if (theme == "true") document.getElementById("themeControlToggle").click();
  } 
  // Otherwise redirect to Auth Pages
  else { location.pathname = PAGES.LOGIN_PAGE; }
  if (preloader) preloader.remove();
});

// ------------------------
// Log out function
// ------------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    await logOut()
  });
}
async function logOut() {
  await signOut(auth);
  localStorage.setItem("isLoggedIn", false);
  location.pathname = PAGES.LOGIN_PAGE;
}
window.logOut = logOut

// ------------------------
// Swal Messages
// ------------------------
import * as Swal from '../vendors/swal.js'

window.failMessage = (err) => {
  return Sweetalert2.fire({
    icon: "error",
    title: "Oops...",
    text: err || "Something went wrong!",
  });
}

window.successMessage = (msg) => {
  return Sweetalert2.fire({
    icon: "success",
    title: "Success!",
    text: msg || "Thank you for reaching out to us!",
  });
}

window.processingMessage = (msg) => {
  return Sweetalert2.fire({
    iconHtml: '<div class="spinner-border text-primary"></div>',
    customClass: { icon: 'no-border' },
    title: "Processing",
    text: msg || "Please wait, processing...",
    allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false,
    showConfirmButton: false,
    backdrop: 'rgba(0,0,0,.65)'
  });
}

window.closeSwal = () => {
  Sweetalert2.close()
}