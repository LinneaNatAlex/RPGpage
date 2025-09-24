// Imports the necessary libraries and hooks to fetch user roles from Firebase Firestore
import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/authContext";

// costum hoo for fetching user roles from firestore, based on authentification.
const useUserRoles = () => {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      // wait until user is shown and avalible , and aut has finished loading
      if (loading) {
        return; // Still loading auth, wait
      }

      if (!user) {
        console.log("No user found, setting empty roles");
        setRoles([]);
        setRolesLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(docRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const userRoles = data?.roles || [];
          setRoles(userRoles);
          console.log("User roles fetched:", userRoles);
        } else {
          console.log("User document doesn't exist, setting empty roles");
          setRoles([]);
        }
      } catch (error) {
        console.error("Error fetching user roles:", error);
        // Set empty roles on error to prevent app from hanging
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, [user, loading]);
  // returns the roles and loading status
  return { roles, rolesLoading };
};

export default useUserRoles;
