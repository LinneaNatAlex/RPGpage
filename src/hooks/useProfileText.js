// Import necessary libraries and hooks
import { useEffect, useState } from "react";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/authContext";

// Custom hook for fetching and storing user's profile content from firestore
const useProfileText = () => {
  // State variables to hold data
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetches the user profile content from firestore when user changes
  useEffect(() => {
    const fetchText = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(docRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setText(data.profileText || "");
      }
      setLoading(false);
    };
    fetchText();
  }, [user]);

  // Profile content is stored in firestore
  const storeText = async (mode, textData) => {
    if (!user) return;
    const dataToStore = {
      profileText: textData,
    };
    await setDoc(doc(db, "users", user.uid), dataToStore, { merge: true });
    // Update the local state to save data
    setText(textData);
  };

  // Return the user profile data
  return { text, loading, storeText };
};

export default useProfileText;
