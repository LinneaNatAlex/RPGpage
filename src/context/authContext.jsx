import { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const authContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Get user data from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // Combine auth and Firestore data
            setUser({
              ...currentUser,
              ...userDoc.data(),
            });
          } else {
            setUser(currentUser);
          }

          setEmailVerified(currentUser.emailVerified);

          // Update online status
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              displayName: currentUser.displayName || currentUser.email,
              online: true,
            },
            { merge: true }
          );

          // Handle offline status
          const handleUnload = async () => {
            await setDoc(
              doc(db, "users", currentUser.uid),
              {
                online: false,
              },
              { merge: true }
            );
          };
          window.addEventListener("beforeunload", handleUnload);
        } else {
          setUser(null);
          setEmailVerified(false);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <authContext.Provider value={{ user, loading, emailVerified }}>
      {children}
    </authContext.Provider>
  );
};

// Calling useAuth will return the value of the context later in the app
export const useAuth = () => useContext(authContext);
