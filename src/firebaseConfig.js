import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";

// Using this method to be able to use the netlify. This way I can use the env variables in the netlify.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Standard Firestore (default persistence). memoryLocalCache() can cause
// "INTERNAL ASSERTION FAILED: Unexpected state" with many listeners – avoid it.
export const db = getFirestore(app);

export const storage = getStorage(app);

// Suppress emulator warnings in development
if (import.meta.env.DEV) {
  // Store original console.warn BEFORE overriding
  const originalWarn = console.warn.bind(console);
  // This suppresses the emulator connection warnings
  console.warn = function (message) {
    if (typeof message === "string" && (message.includes("emulator") || message.includes("findDOMNode"))) {
      return; // Suppress emulator warnings and findDOMNode warnings
    }
    // Call original console.warn for other messages
    originalWarn.apply(console, arguments);
  };
}


export const getUserTerms = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return empty array on error to prevent app from crashing
    return [];
  }
};
