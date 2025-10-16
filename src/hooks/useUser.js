// imports the necessary hooks and firebase functions to get the users
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext"; // Import auth context
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

// costume hook to fetch and return a list of users with REAL-TIME updates
const useUsers = () => {
  const [users, setUsers] = useState([]); ///state users, holding the loding state of users.
  const [loading, setLoading] = useState(true); //state variable, holding the loding state of users.
  const { user, loading: authLoading } = useAuth(); // Get auth state

  useEffect(() => {
    // Don't setup listener if auth is still loading or user is not authenticated
    if (authLoading) return;

    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    console.log("Setting up real-time user listener...");

    // Set up real-time listener for users collection
    const usersRef = collection(db, "users");
    // Get all users first, then filter in JavaScript to avoid Firestore query issues
    const usersQuery = usersRef;

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        console.log(
          "Real-time user update received, users count:",
          snapshot.size
        );

        const updatedUsers = [];
        snapshot.forEach((doc) => {
          const userData = doc.data();
          // Filter for valid races in JavaScript
          const validRaces = [
            "Witch",
            "witch",
            "Wizard",
            "wizard",
            "Vampire",
            "vampire",
            "Werewolf",
            "werewolf",
            "Elf",
            "elf",
          ];
          if (userData.race && validRaces.includes(userData.race)) {
            updatedUsers.push({
              uid: doc.id,
              ...userData,
            });
          }
        });

        // Sort by points in JavaScript instead of Firestore
        updatedUsers.sort((a, b) => (b.points || 0) - (a.points || 0));

        console.log("Processed users:", updatedUsers.length);
        setUsers(updatedUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Real-time users listener error:", error);
        console.log("Falling back to manual fetch...");

        // Fallback to manual fetch if real-time fails
        import("../firebaseConfig").then(({ getUserTerms }) => {
          getUserTerms()
            .then((fallbackUsers) => {
              console.log("Fallback users loaded:", fallbackUsers.length);
              setUsers(fallbackUsers);
              setLoading(false);
            })
            .catch((fallbackError) => {
              console.error("Fallback fetch also failed:", fallbackError);
              setUsers([]);
              setLoading(false);
            });
        });
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("Cleaning up real-time user listener");
      unsubscribe();
    };
  }, [user, authLoading]);

  // returns user list and loading
  return { users, loading };
};

export default useUsers;
