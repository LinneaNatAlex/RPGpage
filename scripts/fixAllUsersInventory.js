// Kjør denne filen én gang for å legge til inventory: [] for alle brukere som mangler det.
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addInventoryToAllUsers() {
  const usersCol = collection(db, "users");
  const usersSnap = await getDocs(usersCol);
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (!data.inventory) {
      await updateDoc(doc(db, "users", userDoc.id), { inventory: [] });
      console.log(`Added inventory to user: ${userDoc.id}`);
    }
  }
  console.log("Done!");
}

addInventoryToAllUsers();
