import { verifyPasswordResetCode, confirmPasswordReset, applyActionCode } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Get the action to complete.
  const mode = urlParams.get('mode');
  // Get the one-time code from the query parameter.
  const actionCode = urlParams.get('oobCode');
  // (Optional) Get the continue URL from the query parameter if available.
  const continueUrl = urlParams.get('continueUrl');

  // Handle the user management action.
  switch (mode) {
    case 'verifyEmail':
      handleVerifyEmail(auth, actionCode, continueUrl);
      return;    
    case 'resetPassword':
      handleResetPassword(auth, actionCode, continueUrl);
      return;
    // case 'recoverEmail': // Not supported
    // default: // Invalid mode.
  }
  location.pathname = PAGES.HOME_PAGE;
}, false);

function handleVerifyEmail(auth, actionCode) {
  verifyEmail.classList.remove("d-none")
  // Try to apply the email verification code.
  applyActionCode(auth, actionCode).then((resp) => {
    // Email address has been verified.
    verification_success.classList.remove("d-none")
  }).catch((error) => {
    // Code is invalid or expired. Ask the user to verify their email address
    // again.
    verification_error.classList.remove("d-none")
  }).finally(() => {
    preloader.remove()
  });
}

function handleResetPassword(auth, actionCode, continueUrl) {
  resetPassword.classList.remove("d-none")
  // Verify the password reset code is valid.
  verifyPasswordResetCode(auth, actionCode).then((email) => {
    const accountEmail = email;
    reset_password.classList.remove("d-none")
  }).catch((error) => {
    // Invalid or expired action code. Ask user to try to reset the password
    // again.
    reset_password_error.classList.remove("d-none")
  }).finally(() => {
    preloader.remove()
  });
}

window.resetPassword = (event) => {
  event.preventDefault(); 
  const form = document.getElementById('reset_password_form');
  const password = form.elements.password.value;
  const confirm_password = form.elements.confirm_password.value;

  if (!password || !confirm_password || password !== confirm_password) {
    reset_password_error_alert.classList.remove("d-none")
    return
  }

  form.reset();

  confirmPasswordReset(auth, actionCode, password).then((resp) => {
    // Password reset has been confirmed and new password updated.
    reset_password.classList.add("d-none")
    reset_password_success.classList.remove("d-none")
  }).catch((error) => {
    // Error occurred during confirmation. The code might have expired or the
    // password is too weak.
    reset_password.classList.add("d-none")
    reset_password_error.classList.remove("d-none")
  });  
}
