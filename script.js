import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Mobile Menu Toggle
const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      navMenu.classList.remove("show");
    }
  });
}

// Active Menu Highlight
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();
  const menuMap = {
    "index.html": "menu-home",
    "dashboard.html": "menu-dashboard",
    "register.html": "menu-register",
    "login.html": "menu-login",
    "settings.html": "menu-settings",
    "faqs.html": "menu-faqs",
    "admin-dashboard.html": "menu-admin"
  };
  const activeId = menuMap[page];
  if (activeId) {
    const activeLink = document.getElementById(activeId);
    if (activeLink) activeLink.classList.add("active");
  }
});

// Firebase Auth Handling
onAuthStateChanged(auth, user => {
  const loginLink = document.getElementById("menu-login");
  const registerLink = document.getElementById("menu-register");
  const logoutLink = document.getElementById("logoutLink");
  const noticeEditor = document.getElementById("noticeEditor");
  const adminLink = document.getElementById("adminLink");

  if (!loginLink || !registerLink || !logoutLink) return;

  if (user) {
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    logoutLink.style.display = "block";

    if (user.email === "tisdomeliphazdigitalshop@gmail.com") {
      if (noticeEditor) noticeEditor.style.display = "block";
      if (adminLink) adminLink.style.display = "block";
    } else {
      if (noticeEditor) noticeEditor.style.display = "none";
      if (adminLink) adminLink.style.display = "none";
    }
  } else {
    loginLink.style.display = "block";
    registerLink.style.display = "block";
    logoutLink.style.display = "none";
    if (noticeEditor) noticeEditor.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
  }
});

// Notices
const noticeRef = doc(db, "notices", "mainNotice");

function loadNotice() {
  getDoc(noticeRef)
    .then(doc => {
      document.getElementById("adminNotice").innerHTML =
        doc.exists() ? `<p>${doc.data().text}</p>` : "<p>No notices yet.</p>";
    })
    .catch(err => console.error("Failed to load notice:", err));
}

function updateNotice() {
  const input = document.getElementById("noticeInput").value.trim();
  if (!input) return alert("❌ Please enter notice text.");

  setDoc(noticeRef, { text: input })
    .then(() => {
      document.getElementById("adminNotice").innerHTML = `<p>${input}</p>`;
      document.getElementById("noticeInput").value = "";
      alert("✅ Notice updated successfully!");
    })
    .catch(err => alert("❌ Error updating notice: " + err));
}

loadNotice();

// Products
async function uploadFile(file, folder) {
  const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("productTitle").value.trim();
    const description = document.getElementById("productDescription").value.trim();
    const price = document.getElementById("productPrice").value.trim();
    const imageFile = document.getElementById("productImage").files[0];
    const videoFile = document.getElementById("productVideo").files[0];

    if (!title || !price) return alert("❌ Title and Price are required!");

    try {
      const imageUrl = imageFile ? await uploadFile(imageFile, "products/images") : "";
      const videoUrl = videoFile ? await uploadFile(videoFile, "products/videos") : "";

      await addDoc(collection(db, "products"), {
        title,
        description,
        price,
        imageUrl,
        videoUrl,
        createdAt: new Date()
      });

      alert("✅ Product uploaded successfully!");
      uploadForm.reset();
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("❌ Error uploading product: " + err.message);
    }
  });
}

async function loadProducts() {
  const productContainer = document.getElementById("product-list");
  if (!productContainer) return;

  productContainer.innerHTML = `<div class="loading-spinner"></div><p>Loading products...</p>`;

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    productContainer.innerHTML = snapshot.empty ? `<p>No products available yet.</p>` : "";

    snapshot.forEach(doc => {
      const product = doc.data();
      const productEl = document.createElement("div");
      productEl.classList.add("product");
      productEl.innerHTML = `
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" />` : ""}
        <h3>${product.title}</h3>
        <p>${product.description || ""}</p>
        <p class="price">₦${product.price}</p>
        ${product.videoUrl ? `<video controls class="product-video"><source src="${product.videoUrl}" type="video/mp4"></video>` : ""}
        <button class="btn pay-now" onclick="addToCart('${doc.id}', '${product.title}', ${product.price}, '${product.imageUrl || ""}')">Add to Cart</button>
      `;
      productContainer.appendChild(productEl);
    });
  } catch (err) {
    console.error(err);
    productContainer.innerHTML = `<p>❌ Failed to load products.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);

// Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(id, title, price, imageUrl) {
  cart.push({ id, title, price, imageUrl });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
  alert(`✅ "${title}" added to cart!`);
}

function updateCartDisplay() {
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");
  cartCount.textContent = cart.length;
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  if (cartTotal) cartTotal.textContent = `₦${total.toFixed(2)}`;
}

updateCartDisplay();