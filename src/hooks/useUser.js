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


    // Set up real-time listener for users collection
    const usersRef = collection(db, "users");
    // Get all users first, then filter in JavaScript to avoid Firestore query issues
    const usersQuery = usersRef;

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {

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

        setUsers(updatedUsers);
        setLoading(false);
      },
      (error) => {

        // Fallback to manual fetch if real-time fails
        import("../firebaseConfig").then(({ getUserTerms }) => {
          getUserTerms()
            .then((fallbackUsers) => {
              setUsers(fallbackUsers);
              setLoading(false);
            })
            .catch((fallbackError) => {
              setUsers([]);
              setLoading(false);
            });
        });
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [user, authLoading]);

  // returns user list and loading
  return { users, loading };
};

export default useUsers;
