// ============================================================
// FIREBASE CONFIGURATION — BookWise (Dext Reader)
// ============================================================

const firebaseConfig = {
  apiKey            : "AIzaSyAWobldHjXOGCFVQ-dXxnJnw_DmEiYmqWA",
  authDomain        : "dext-reader.firebaseapp.com",
  projectId         : "dext-reader",
  storageBucket     : "dext-reader.firebasestorage.app",
  messagingSenderId : "134077382199",
  appId             : "1:134077382199:web:e306db763197345a6089b2",
  measurementId     : "G-4EYVYNNB0E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services — available globally across all pages
const auth = firebase.auth();
const db   = firebase.firestore();

// ── Admin email ──────────────────────────────────────────────
// Change this to the email you signed up with
const ADMIN_EMAIL = "dextermohan01@gmail.com";