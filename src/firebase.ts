import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVlsP0ygnEmaqUXnwIyVChzk6xxjolZf4",
  authDomain: "edulx-platform-8aa10.firebaseapp.com",
  projectId: "edulx-platform-8aa10",
  storageBucket: "edulx-platform-8aa10.firebasestorage.app",
  messagingSenderId: "9779470311",
  appId: "1:9779470311:web:80a5192eb9767e8690a742",
  measurementId: "G-677J995LXH",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 