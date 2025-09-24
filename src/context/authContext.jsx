import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// BanOverlay: shows ban message and a back arrow to main page
function BanOverlay({ reason, bannedType }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(30,30,40,0.97)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "none",
          border: "none",
          color: "#ffd86b",
          fontSize: 32,
          cursor: "pointer",
        }}
        aria-label="Back to main page"
        title="Back to main page"
      >
        ←
      </button>
      <h1 style={{ color: "#ff6b6b" }}>Account Banned</h1>
      <p style={{ fontSize: 18, marginBottom: 16 }}>
        {reason || "You are banned and cannot access this site."}
      </p>
      <div style={{ fontSize: 15, color: "#ffd86b", marginBottom: 12 }}>
        {bannedType === "ip"
          ? "Your IP address has been permanently banned from this site. If you believe this is a mistake, please contact an administrator."
          : "Your account has been permanently banned from this site. If you believe this is a mistake, please contact an administrator."}
      </div>
    </div>
  );
}
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
    console.log("AuthProvider: Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log(
        "AuthProvider: Auth state changed, currentUser:",
        currentUser?.uid || "null"
      );

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn("Auth loading timeout - forcing loading to false");
        setLoading(false);
      }, 10000); // 10 second timeout

      try {
        if (currentUser) {
          console.log("AuthProvider: Processing authenticated user");
          // Get user data from Firestore with retry logic
          let userDoc;
          let retries = 2; // Reduce retries to prevent long loading times
          while (retries > 0) {
            try {
              const userDocRef = doc(db, "users", currentUser.uid);
              userDoc = await getDoc(userDocRef);
              break;
            } catch (firestoreError) {
              console.warn(`Firestore error (${3 - retries}):`, firestoreError);
              retries--;
              if (retries === 0) {
                console.error("Failed to fetch user data after 2 attempts");
                // Set user anyway with basic data to prevent infinite loading
                setUser(currentUser);
                setEmailVerified(currentUser.emailVerified);
                setBlocked({
                  blocked: false,
                  reason: "",
                  until: null,
                  bannedType: null,
                });
                setLoading(false);
                return;
              }
              // Reduce wait time between retries
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          let userData = currentUser;
          if (userDoc && userDoc.exists()) {
            userData = { ...currentUser, ...userDoc.data() };
            setUser(userData);
          } else {
            // If user document doesn't exist and email is not verified,
            // don't set the user (they need to complete verification first)
            if (!currentUser.emailVerified) {
              setUser(null);
              setEmailVerified(false);
              setBlocked({
                blocked: false,
                reason: "",
                until: null,
                bannedType: null,
              });
              setLoading(false);
              return;
            }
            setUser(currentUser);
          }

          setEmailVerified(currentUser.emailVerified);

          // SUSPENSION/BAN/IP-BAN CHECK
          let blocked = false;
          let reason = "";
          let until = null;
          let description = "";
          let bannedType = null;
          const now = Date.now();
          if (userData.bannedIp) {
            blocked = true;
            reason = "Your IP address is permanently banned.";
            bannedType = "ip";
          } else if (userData.banned) {
            blocked = true;
            reason = "Your account is permanently banned.";
            bannedType = "account";
          } else if (
            false &&
            userData.pausedUntil &&
            userData.pausedUntil > now
          ) {
            // TEMPORARILY DISABLED - suspend check
            blocked = true;
            reason = "Your account is temporarily suspended.";
            until = userData.pausedUntil;
            description = userData.suspendReason || "";
          }
          setBlocked({ blocked, reason, until, description, bannedType });

          // Update online status with error handling (only for verified users with Firestore data)
          try {
            if (currentUser.emailVerified && userDoc && userDoc.exists()) {
              // Use a timeout to prevent this from blocking the auth process
              const updateOnlinePromise = setDoc(
                doc(db, "users", currentUser.uid),
                {
                  displayName: currentUser.displayName || currentUser.email,
                  online: true,
                  lastLogin: new Date(),
                },
                { merge: true }
              );

              // Don't wait more than 3 seconds for online status update
              Promise.race([
                updateOnlinePromise,
                new Promise((resolve) => setTimeout(resolve, 3000)),
              ]).catch((onlineError) => {
                console.warn("Failed to update online status:", onlineError);
              });
            }
          } catch (onlineError) {
            console.warn("Failed to update online status:", onlineError);
          }

          // Handle offline status
          const handleUnload = async () => {
            try {
              if (currentUser.emailVerified && userDoc && userDoc.exists()) {
                await setDoc(
                  doc(db, "users", currentUser.uid),
                  {
                    online: false,
                  },
                  { merge: true }
                );
              }
            } catch (error) {
              console.warn("Failed to update offline status:", error);
            }
          };
          window.addEventListener("beforeunload", handleUnload);
        } else {
          console.log("AuthProvider: No authenticated user, setting null");
          setUser(null);
          setEmailVerified(false);
          setBlocked({
            blocked: false,
            reason: "",
            until: null,
            bannedType: null,
          });
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        // Set loading to false even on error to prevent infinite loading
        setLoading(false);
      } finally {
        clearTimeout(timeoutId); // Clear timeout when auth process completes
        console.log("AuthProvider: Setting loading to false");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <authContext.Provider value={{ user, loading, emailVerified }}>
      {/* TEMPORARILY DISABLED - ALL BLOCKING LOGIC 
      {blocked.blocked ? (
        blocked.bannedType ? (
          <BanOverlay reason={blocked.reason} bannedType={blocked.bannedType} />
        ) : (
          <SuspendedOverlay
            until={blocked.until}
            reason={blocked.reason}
            description={blocked.description}
          />
        )
      ) : (
        children
      )}
      */}
      {children}
    </authContext.Provider>
  );
};

// Calling useAuth will return the value of the context later in the app
export const useAuth = () => useContext(authContext);
