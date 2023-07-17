import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } 
  from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getDatabase, set, ref } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { app, PAGES } from "./index.js";

const db = getDatabase(app);
const auth = getAuth();

const registerForm = document.getElementById("registerForm");
const register_error_alert = document.getElementById("register_error_alert")
async function signUp (event) {
  event.preventDefault();
  processingMessage()
  const formProps = new FormData(registerForm);
  const formData = Object.fromEntries(formProps);
  if (validateFormData(formData)) {
    try {
      const { name, email, password } = formData;
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = result.user.uid;
      await sendEmailVerification(auth.currentUser);
      await addProfile(userId, name, email);
      // await successMessage("Registered Successfully! Check your email to verify.");
      location.pathname = PAGES.CONFIRM_PAGE
    } catch (error) {
      if (register_error_alert) {
        let message = "Something went wrong!"
        switch (error?.code) {
          case 'auth/invalid-email': message = "Invalid email"; break;
          case 'auth/user-not-found': message = "User doesn't exist!"; break;
          case 'auth/wrong-password': message = "Wrong Password"; break;
          case 'auth/weak-password': message = "Password don't match or is too weak"; break;
          case 'auth/email-already-in-use': message = "Email already registered"; break;
        }
  
        register_error_alert.innerHTML = message
        register_error_alert.classList.remove("d-none")
      }
    }
  }
}

window.signUp = signUp

function validateFormData(formData) {
  const { name, email, password, confirmPassword, checkbox } = formData;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !password?.trim() ||
    !confirmPassword?.trim() ||
    !checkbox
  ) {
    if (register_error_alert) {
      register_error_alert.innerHTML = "Please fill all the details correctly!";
      register_error_alert.classList.remove("d-none")
    }
    return false;
  }

  if (password !== confirmPassword) {
    if (register_error_alert) {
      register_error_alert.innerHTML = "Password & Confirm password don't match!";
      register_error_alert.classList.remove("d-none")
    }
    return false;
  }

  return true;
}

export async function addProfile(userId, name, email) {
  // TODO: Update Referal Code
  try {
    await set(ref(db, `${userId}`), {
      profile: { name, email, referralCode: userId },
      settings: { dualFactorAuth: false, theme: 'light', currency: "USD" },
      invites: { sent: 0, successful: 0, earned: 0, withdrawn: 0 },
      card: { number: '', type: '', name: '', expiryDate: '' }
    });
  } catch (error) {
    if (register_error_alert) {
      let message = "Something went wrong!"
      register_error_alert.innerHTML = message
      register_error_alert.classList.remove("d-none")
    }    
  }
}

window.showNumPart = (event) => {
  // console.log()
  var selectElement = event.target
  var selectedOption = selectElement.options[selectElement.selectedIndex];
  selectedOption.text = selectedOption.value;
}