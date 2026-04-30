// ============================================================
// FIREBASE CONFIGURATION
// Replace the values below with your Firebase project config
// Go to: Firebase Console → Project Settings → Your Apps → SDK setup
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services (available globally)
const auth = firebase.auth();
const db   = firebase.firestore();

// ── Admin email ──────────────────────────────────────────────
// Change this to your own email to get admin access
const ADMIN_EMAIL = "admin@bookwise.com";