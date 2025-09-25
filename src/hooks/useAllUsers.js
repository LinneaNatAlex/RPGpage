import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const useAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "users"));
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid,
          displayName: doc.data().displayName || doc.data().email,
          email: doc.data().email,
          profileImageUrl: doc.data().profileImageUrl,
          roles: doc.data().roles || [],
        }));

        // Sort users alphabetically by display name
        usersList.sort((a, b) => a.displayName.localeCompare(b.displayName));

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading };
};

export default useAllUsers;
