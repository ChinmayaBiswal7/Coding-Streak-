import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBxuUM_EUTtDeKxX9Tdo4AvxvskLGx9dVo",
  authDomain: "code-streak-1a1e4.firebaseapp.com",
  projectId: "code-streak-1a1e4",
  storageBucket: "code-streak-1a1e4.firebasestorage.app",
  messagingSenderId: "657875277691",
  appId: "1:657875277691:web:843ad42dcc6dbc448f0fde",
  measurementId: "G-JKTDLRKR1V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

export { app, auth, db };
