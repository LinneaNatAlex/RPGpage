// Script to update all users with race "Witch" to "Wizard" in Firestore
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

// Firebase configuration (you may need to adjust this based on your config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateWitchToWizard() {
  try {
    console.log("Starting migration: Witch -> Wizard");

    // Get all users with race "Witch"
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("race", "==", "Witch"));
    const querySnapshot = await getDocs(q);

    console.log(`Found ${querySnapshot.size} users with race "Witch"`);

    const updatePromises = [];

    querySnapshot.forEach((userDoc) => {
      console.log(
        `Updating user: ${userDoc.id} (${
          userDoc.data().displayName || userDoc.data().email
        })`
      );

      const updatePromise = updateDoc(doc(db, "users", userDoc.id), {
        race: "Wizard",
      });

      updatePromises.push(updatePromise);
    });

    // Execute all updates
    await Promise.all(updatePromises);

    console.log(
      `Successfully updated ${updatePromises.length} users from "Witch" to "Wizard"`
    );
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
updateWitchToWizard();
