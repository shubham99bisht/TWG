import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

import {
  getDatabase,
  set,
  ref,
  get,
  child,
  remove,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

import { successMessage, failMessage, app } from "./index.js";

const db = getDatabase(app);
const dbRef = ref(getDatabase());

const auth = getAuth();

const profileForm = document.getElementById("profileForm");
const dualFactorBtn = document.getElementById("dualFactorBtn");
const themeSwitchBtn = document.getElementById("themeSwitchBtn");
const passwordForm = document.getElementById("updatePasswordForm");

async function setProfile(userId) {
  const userData = await get(child(dbRef, `${userId}`));
  if (userData.exists()) {
    const data = userData.val();
    const { profile, settings } = data;
    console.log(userId, data);
    const { name, email } = profile;
    const { dualFactorAuth, darkTheme, currency } = settings;

    document.getElementById("name").value = name;
    document.getElementById("email").value = email;
    if (profile?.phone) {
      document.getElementById("phone").value = profile.phone;
    }

    dualFactorBtn.checked = dualFactorAuth;
    themeSwitchBtn.checked = darkTheme;

  } else {
    failMessage("Failed to load user data!");
  }
}

profileForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  if (!name?.trim()
    // || !phone?.trim()
  ) {
    failMessage("Name and Phone can't be empty!");
    return;
  }

  try {
    await updateProfile(auth.currentUser, {
      displayName: name,
    });

    // phone number is remaining!

    await set(ref(db, `${auth.currentUser.uid}/profile/name`), name);
    // await set(ref(db, `profile/${auth.currentUser.uid}/phone`), phone);
    successMessage("Profile Updated!");
  } catch (error) {
    failMessage(error.message);
    console.log(error);
  }
});

passwordForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const user = auth.currentUser;
  const oldPassword = document.getElementById("old-password").value;
  const credentials = EmailAuthProvider.credential(user.email, oldPassword);

  try {
    await reauthenticateWithCredential(user, credentials);
  } catch (error) {
    failMessage("Wrong password!");
    console.log(error);
    return;
  }

  const password = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  if (password !== confirmPassword) {
    failMessage("Both passwords should match!");
    return;
  }

  try {
    await updatePassword(user, password);
    successMessage("Password updated!");
  } catch (error) {
    failMessage(error.message);
    console.log(error);
  }
});

dualFactorBtn.addEventListener("click", async function () {
  const checked = dualFactorBtn.checked;
  const successMsg = checked ? "Dual factor enabled!" : "Dual factor disabled!";
  const failureMsg = checked
    ? "Failed to enable dual factor!"
    : "Failed to disable dual factor";
  try {
    await set(
      ref(db, `${auth.currentUser.uid}/settings/dualFactorAuth`),
      checked
    );
    successMessage(successMsg);
  } catch (error) {
    failMessage(failureMsg);
    console.log(error);
  }
});

themeSwitchBtn.addEventListener("click", async function () {
  const checked = themeSwitchBtn.checked;
  localStorage.setItem("darkMode", checked);
  document.getElementById("themeControlToggle").click();
  try {
    await set(ref(db, `${auth.currentUser.uid}/settings/darkTheme`), checked);
  } catch (error) {
    console.log(error);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const user = auth.currentUser;
    const emailVerified = user.emailVerified;
    if (!emailVerified) {
      failMessage("Please verify your email first!");
      await signOut(auth);
      return;
    }
    await setProfile(user.uid);
    // decidePasswordUpdate(user);
  }
});

  // function decidePasswordUpdate(user) {
  //   user.providerData.forEach((profile) => {
  //     if (profile.providerId === "password") {
  //       allowPasswordUpdate = true;
  //       document.getElementById("new-password").disabled = false;
  //       document.getElementById("confirm-password").disabled = false;
  //       document.getElementById("updatePasswordBtn").disabled = false;
  //     }
  //   });
  // }