// auth.js – TisdomEliphazDigitalShop (Firebase v10 Modular)

import { auth, db, provider } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendEmailVerification, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Login with Email & Password
export async function login(email, password) {
  if (!email || !password) {
    alert("⚠️ Please enter both email and password.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const isGoogleUser = user.providerData.some(p => p.providerId === "google.com");
    if (!user.emailVerified && !isGoogleUser) {
      alert("⚠️ Please verify your email before logging in.");
      await signOut(auth);
      return;
    }

    handleRedirectByRole(user.email);
  } catch (err) {
    console.error("Login Error:", err);
    alert("❌ " + err.message);
  }
}

// Google Login (Popup only — avoids redirect issues)
export async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await saveUserProfile(user, user.displayName);
    handleRedirectByRole(user.email);
  } catch (err) {
    console.error("Google Login Error:", err);
    alert("❌ " + err.message);
  }
}

// Register New Account (with name support)
export async function register(email, password, name) {
  if (!email || !password || !name) {
    alert("⚠️ Please fill all fields.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save name in Firebase Auth profile
    await updateProfile(user, { displayName: name });

    // Save profile in Firestore
    await saveUserProfile(user, name);

    // Send verification email
    await sendVerification();

    alert("✅ Account created! Please check your inbox to verify your email.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Registration Error:", err);
    alert("❌ " + err.message);
  }
}

// Save User Profile in Firestore
async function saveUserProfile(user, name = null) {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const role = user.email === "tisdomeliphazdigitalshop@gmail.com" ? "admin" : "user";
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: name || user.displayName || "",
      role: role,
      createdAt: serverTimestamp()
    });
  }
}

// Send Verification Email
export async function sendVerification() {
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
      alert("📩 Verification email sent!");
    } catch (err) {
      console.error("Verification Error:", err);
      alert("❌ " + err.message);
    }
  }
}

// Logout
export async function logout() {
  try {
    await signOut(auth);
    alert("👋 You have been logged out.");
    window.location.replace("login.html");
  } catch (err) {
    console.error("Logout Error:", err);
    alert("❌ " + err.message);
  }
}

// Role-based redirects
function handleRedirectByRole(email) {
  if (email === "tisdomeliphazdigitalshop@gmail.com") {
    window.location.replace("admin-dashboard.html"); // Fixed
  } else {
    window.location.replace("dashboard.html");
  }
}

// Auth state listener
onAuthStateChanged(auth, (user) => {
  const userInfo = document.getElementById("user-info");
  const loginBtn = document.getElementById("googleLogin");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    if (userInfo) {
      userInfo.innerHTML = `
        <img src="${user.photoURL || "default-avatar.png"}" 
             alt="User Photo" 
             style="width:40px; height:40px; border-radius:50%;">
        <span>Welcome, ${user.displayName || user.email}</span>
      `;
    }
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    handleRedirectByRole(user.email);
  } else {
    if (userInfo) userInfo.innerHTML = "";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});