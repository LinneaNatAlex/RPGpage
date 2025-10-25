// Copy and paste this into browser console to run migration
// Make sure you're logged in as admin first

async function updateWitchToWizard() {
  try {
    console.log("Starting migration: Witch -> Wizard");

    // Import Firebase functions (these should already be available in the app)
    const { collection, getDocs, updateDoc, doc, query, where } = await import(
      "firebase/firestore"
    );
    const { db } = await import("../src/firebaseConfig");

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
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
updateWitchToWizard();
