import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth, signOut, signInWithPopup, onAuthStateChanged, GoogleAuthProvider, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

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

  if (user) {
    addUserProfile(user)
    // Handle Auth Pages
    if (isAuthPage) {
      location.href = PAGES.HOME_PAGE;
    }
  }
  // Otherwise redirect to Auth Pages
  else { if (!isAuthPage) location.href = PAGES.LOGIN_PAGE; }
  if (preloader) preloader.remove();
});

function addUserProfile(user) {
  // Reference to the user's entry in the database
  const userRef = ref(getDatabase(), `users/${user.uid}`);

  // Check if the user's entry exists in the database
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // User's entry exists, retrieve the user's role
        // const userRole = snapshot.val().role;
        // console.log("User's role:", userRole);
      } else {
        const name = user.displayName;
        const email = user.email;
        const role = "None";

        set(userRef, { name, email, role })
          .then(() => {
            console.log("Default role set successfully!");
          })
          .catch((error) => {
            console.error("Error setting default role:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error checking user's entry:", error);
    });
}


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


// Payment Stages
const paymentStages = [
  { value: 'hybrid-in-country', label: 'Hybrid (In-country)' },
  { value: 'pathway-term-1', label: 'Pathway college Term-1' },
  { value: 'pathway-term-2', label: 'Pathway college Term-2' },
  { value: 'pathway-year-1', label: 'Pathway college Year-1' },
  { value: 'university-term-1', label: 'University Term-1' },
  { value: 'university-term-2', label: 'University Term-2' },
  { value: 'university-year-1', label: 'University Year-1' }
];
window.paymentStages = paymentStages;

// Download functions
function downloadCSV(downloadName='data') {
  const table = document.querySelector('.table');
  if (!table) {
      console.error("Table element not found.");
      return;
  }  

  var rows = table.querySelectorAll('tr');
  var csvContent = "data:text/csv;charset=utf-8,";
  
  rows.forEach(function(row) {
      var rowData = [];
      row.querySelectorAll('td, th').forEach(function(cell) {
          rowData.push(cell.textContent.trim());
      });
      csvContent += rowData.join(',') + "\r\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", blobUrl);
  link.setAttribute("download", downloadName + ".csv");

  link.click();

  URL.revokeObjectURL(blobUrl);
}

const { jsPDF } = window.jspdf;
const pdf = new jsPDF();
function downloadPDF(downloadName='data') {
  const table = document.querySelector('.table');  
  if (!table) {
      console.error("Table element not found.");
      return;
  }  
  pdf.autoTable({ html: table });
  pdf.save(`${downloadName}.pdf`);
}

window.downloadCSV = downloadCSV
window.downloadPDF = downloadPDF
