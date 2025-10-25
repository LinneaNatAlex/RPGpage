// Simple migration script - copy and paste into browser console
async function updateWitchToWizard() {
  try {
    console.log("Starting migration: Witch -> Wizard");

    // Use the existing Firebase instance from the app
    const { collection, getDocs, updateDoc, doc, query, where } =
      window.firebase || {};

    if (!collection) {
      console.error(
        "Firebase not available. Make sure you're on the app page."
      );
      return;
    }

    // Get the db instance from the app
    const db = window.db || window.firebase?.firestore();

    if (!db) {
      console.error(
        "Firestore not available. Make sure you're on the app page."
      );
      return;
    }

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
