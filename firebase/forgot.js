import {
  getAuth,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

const auth = getAuth();

const submitBtn = document.getElementById("submitBtn");
if (submitBtn) {
  submitBtn.addEventListener("click", submit);
}

async function submit() {
  const email = document.getElementById("email").value;
  const forget_error_alert = document.getElementById("forget_error_alert")
  const forget_success_alert = document.getElementById("forget_success_alert")

  forget_error_alert.classList.add("d-none")
  forget_success_alert.classList.add("d-none")

  if (!email?.trim()) {
    if (forget_error_alert) {
      forget_error_alert.classList.remove("d-none")
      forget_error_alert.innerHTML = "Please provide a valid email"
    }    
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
    if (forget_error_alert) {
      document.getElementById("email").value = ""
      forget_success_alert.classList.remove("d-none")
    }
  } catch (error) {
    console.log(error)
    if (forget_error_alert) {
      let errorMessage = "Something went wrong."
      if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "User doesn't exist!";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      forget_error_alert.innerHTML = errorMessage
      forget_error_alert.classList.remove("d-none")
    }
  }  
}
