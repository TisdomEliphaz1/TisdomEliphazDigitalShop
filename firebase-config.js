// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBf1TfghPPvNruPAivvBGemTONIAMojpTo",
  authDomain: "tisdomeliphazdigitalshop-54334.firebaseapp.com",
  projectId: "tisdomeliphazdigitalshop-54334",
  storageBucket: "tisdomeliphazdigitalshop-54334.appspot.com",
  messagingSenderId: "357088535938",
  appId: "1:357088535938:web:ef771a7192eb4031fa9b9b",
  measurementId: "G-3D49SLEKL3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);