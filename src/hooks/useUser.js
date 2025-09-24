// imports the necessary hooks and firebase functions to get the users
import { useState, useEffect } from "react";
import { getUserTerms } from "../firebaseConfig"; // Import the function to fetch user terms from Firebase
import { useAuth } from "../context/authContext"; // Import auth context

// costume hook to fetch and return a list of users
const useUsers = () => {
  const [users, setUsers] = useState([]); ///state users, holding the loding state of users.
  const [loading, setLoading] = useState(true); //state variable, holding the loding state of users.
  const { user, loading: authLoading } = useAuth(); // Get auth state

  useEffect(() => {
    const fetchUsers = async () => {
      // Don't fetch if auth is still loading or user is not authenticated
      if (authLoading) return;

      if (!user) {
        setUsers([]);
        setLoading(false);
        return;
      }

      //Fetches the users form the database utsing by using getUserTerms function, which is connected to firebaseConfig.js. Useres are saved in state variables.
      try {
        // fetch users using firebase config function
        const allUsers = await getUserTerms();
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to fetch witch or wizard users:", error.message);
        // Set empty array on error instead of keeping loading state
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers(); // calls the fetch user function to fetch users from the db
  }, [user, authLoading]);
  // returns user list and loading
  return { users, loading };
};

export default useUsers;
