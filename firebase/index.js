import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth, signOut, signInWithPopup, onAuthStateChanged, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-7KJ7TpHuBUiTlZEhZfW2eE4SOaSornA",
  authDomain: "commissions-management-tool.firebaseapp.com",
  databaseURL: "https://commissions-management-tool-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "commissions-management-tool",
  storageBucket: "commissions-management-tool.appspot.com",
  messagingSenderId: "1012488519856",
  appId: "1:1012488519856:web:b9f47b4a3ed5b9f5167b75",
  measurementId: "G-PEWRNYQZZ2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getDatabase();

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
  return
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
// Log In function
// ------------------------

const theworldgrad = document.getElementById("theworldgrad")
if (theworldgrad) theworldgrad.addEventListener('click', () => googleSignIn('theworldgrad'))

const linkeducation = document.getElementById("linkeducation")
if (linkeducation) linkeducation.addEventListener('click', () => googleSignIn('linkeducation'))

function googleSignIn(allowedDomains) {
  // Replace 'YOUR_WEB_CLIENT_ID' with your actual Web client ID
  var googleAuthProvider = new GoogleAuthProvider();
  googleAuthProvider.setCustomParameters({ hd: allowedDomains });

  signInWithPopup(auth, googleAuthProvider)
    .then((userCredential) => {
      // Handle successful sign-in
      var user = userCredential.user;
      console.log('User signed in:', user);
    })
    .catch((error) => {
      // Handle sign-in errors
      console.error('Error signing in:', error);
    });
}


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