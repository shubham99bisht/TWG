import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth, signOut, signInWithPopup, onAuthStateChanged, GoogleAuthProvider, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
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
  HOME_PAGE: './index.html',
  LOGIN_PAGE: './auth.html',
}

// ------------------------
// OnAuthStateChange
// ------------------------
onAuthStateChanged(auth, async (user) => {
  const currentPage = location.pathname;
  const isAuthPage = currentPage.includes('auth')
  const preloader = document.querySelector('#preloader');

  // Handle Auth Pages
  if (isAuthPage) {
    if (user) location.href = PAGES.HOME_PAGE;
  }
  else if (user) {
    // Pass
  } 
  // Otherwise redirect to Auth Pages
  else { location.href = PAGES.LOGIN_PAGE; }
  if (preloader) preloader.remove();
});


// ------------------------
// Log In function
// ------------------------

const theworldgrad = document.getElementById("theworldgrad")
if (theworldgrad) theworldgrad.addEventListener('click', () => googleSignIn('theworldgrad.com'))

const linceducation = document.getElementById("linceducation")
if (linceducation) linceducation.addEventListener('click', () => googleSignIn('linceducation.com'))

function googleSignIn(allowedDomains) {
  var googleAuthProvider = new GoogleAuthProvider();
  googleAuthProvider.setCustomParameters({ hd: allowedDomains });

  signInWithPopup(auth, googleAuthProvider)
    .then((userCredential) => {
      // Handle successful sign-in
    })
    .catch((error) => {
      // Handle sign-in errors
      failMessage('Error signing in:', error);
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
  location.href = PAGES.LOGIN_PAGE;
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

// To be removed

function signInAdmin(email, pass) {
  signInWithEmailAndPassword(auth, email, pass)
}
window.signInAdmin = signInAdmin
