// imports the necessary hooks and firebase functions to get the users
import { useState, useEffect } from "react";
import { getUserTerms } from "../firebaseConfig"; // Import the function to fetch user terms from Firebase

// costume hook to fetch and return a list of users
const useUsers = () => {
  const [users, setUsers] = useState([]); ///state users, holding the loding state of users.
  const [loading, setLoading] = useState(true); //state variable, holding the loding state of users.

  useEffect(() => {
    const fetchUsers = async () => {
      //Fetches the users form the database utsing by using getUserTerms function, which is connected to firebaseConfig.js. Useres are saved in state variables.
      try {
        // fetch users using firebase config function
        const allUsers = await getUserTerms();
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to fetch witch or wizard users:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers(); // calls the fetch user function to fetch users from the db
  }, []);
  // returns user list and loading
  return { users, loading };
};

export default useUsers;
