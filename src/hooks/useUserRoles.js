import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/authContext";

const useUserRoles = () => {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (loading || !user) return;
      console.log("ingen bruker funnet");

      // setRoles([]);
      // setLoadingRoles(false);
      // return;

      //   const fetchRoles = async () => {
      // console.log("fetching roles");
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
        //   else {
        //     setUserRoles([]);
        //   }
      } catch (error) {
        console.error("Error fetching user roles:", error);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, [user, loading]);

  return { roles, rolesLoading };
};

export default useUserRoles;
