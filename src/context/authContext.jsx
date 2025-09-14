import { createContext, useState, useContext, useEffect } from "react";
import SuspendedOverlay from "../Components/SuspendedOverlay";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const authContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [blocked, setBlocked] = useState({
    blocked: false,
    reason: "",
    until: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Get user data from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          let userData = currentUser;
          if (userDoc.exists()) {
            userData = { ...currentUser, ...userDoc.data() };
            setUser(userData);
          } else {
            setUser(currentUser);
          }

          setEmailVerified(currentUser.emailVerified);

          // SUSPENSION/BAN/IP-BAN CHECK
          let blocked = false;
          let reason = "";
          let until = null;
          let description = "";
          const now = Date.now();
          if (userData.bannedIp) {
            blocked = true;
            reason = "Your IP address is permanently banned.";
          } else if (userData.banned) {
            blocked = true;
            reason = "Your account is permanently banned.";
          } else if (userData.pausedUntil && userData.pausedUntil > now) {
            blocked = true;
            reason = "Your account is temporarily suspended.";
            until = userData.pausedUntil;
            description = userData.suspendReason || "";
          }
          setBlocked({ blocked, reason, until, description });

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
          setBlocked({ blocked: false, reason: "", until: null });
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Ekstra robust: vis SuspendedOverlay hvis user finnes og har pausedUntil i fremtiden
  const now = Date.now();
  const isSuspended = blocked.blocked || (user && user.pausedUntil && user.pausedUntil > now);
  const suspendUntil = blocked.until || (user && user.pausedUntil);
  const suspendReason = blocked.reason || (user && user.suspendReason);
  const suspendDesc = blocked.description || (user && user.suspendReason);

  return (
    <authContext.Provider value={{ user, loading, emailVerified }}>
      {isSuspended ? (
        <SuspendedOverlay
          until={suspendUntil}
          reason={suspendReason}
          description={suspendDesc}
        />
      ) : (
        children
      )}
    </authContext.Provider>
  );
};

// Calling useAuth will return the value of the context later in the app
export const useAuth = () => useContext(authContext);
