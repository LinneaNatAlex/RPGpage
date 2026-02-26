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
    if (loading) return;
    if (!user) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    // Auth context merger doc data into user – bruk det og spar 1 getDoc per reload
    const fromAuth = Array.isArray(user.roles) ? user.roles : [];
    if (fromAuth.length > 0 || (user.roles !== undefined && user.roles !== null)) {
      setRoles(Array.isArray(user.roles) ? user.roles : []);
      setRolesLoading(false);
      return;
    }
    const fetchRoles = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRoles(data?.roles || []);
        } else setRoles([]);
      } catch {
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
