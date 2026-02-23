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
        const usersList = snapshot.docs.map((doc) => {
          const data = doc.data();
          let roles = data.roles;
          if (!Array.isArray(roles)) roles = roles ? [roles] : [];
          return {
            id: doc.id,
            uid: data.uid || doc.id,
            displayName: data.displayName || data.email,
            email: data.email,
            profileImageUrl: data.profileImageUrl,
            roles,
          };
        });

        // Sort users alphabetically by display name
        usersList.sort((a, b) => a.displayName.localeCompare(b.displayName));

        setUsers(usersList);
      } catch (error) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading };
};

export default useAllUsers;
