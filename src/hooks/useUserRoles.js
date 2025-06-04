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
      if (loading || !user) return;
      console.log("ingen bruker funnet");

      try {
        const docRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(docRef);
        const data = userDoc.data();

        //   setUserRoles(data?.roles || []);
        if (userDoc.exists() && data?.roles) {
          setRoles(data.roles);
          console.log("User roles fetched:", data.roles);
        } else {
          console.log("No roles found for user");
          setRoles([]);
        }
        //  catches error if there is any ishues fetching roles
      } catch (error) {
        console.error("Error fetching user roles:", error);
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
