// Admin function to update all users with race "Witch" to "Wizard"
// This can be run from the admin panel or browser console

import { db } from "../src/firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

export const updateWitchToWizard = async () => {
  try {
    console.log("Starting migration: Witch -> Wizard");

    // Get all users with race "Witch"
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("race", "==", "Witch"));
    const querySnapshot = await getDocs(q);

    console.log(`Found ${querySnapshot.size} users with race "Witch"`);

    if (querySnapshot.size === 0) {
      console.log('No users found with race "Witch"');
      return;
    }

    const updatePromises = [];

    querySnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      console.log(
        `Updating user: ${userDoc.id} (${
          userData.displayName || userData.email
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

    return {
      success: true,
      updatedCount: updatePromises.length,
    };
  } catch (error) {
    console.error("Error during migration:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// For browser console usage:
// window.updateWitchToWizard = updateWitchToWizard;
