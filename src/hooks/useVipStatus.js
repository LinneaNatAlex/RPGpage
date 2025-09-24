import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const useVipStatus = () => {
  const { user } = useAuth();
  const [isVip, setIsVip] = useState(false);
  const [vipExpiresAt, setVipExpiresAt] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsVip(false);
      setVipExpiresAt(null);
      setDaysRemaining(0);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (userDoc) => {
        try {
          if (userDoc.exists()) {
            const data = userDoc.data();
            const roles = data.roles || [];
            const expiry = data.vipExpiresAt;
            const now = Date.now();

            // Sjekk om VIP har utløpt
            if (expiry && now > expiry) {
              // Fjern VIP rolle hvis utløpt
              const newRoles = roles.filter((role) => role !== "vip");
              try {
                await updateDoc(userRef, {
                  roles: newRoles,
                  vipExpiresAt: null,
                });
              } catch (updateError) {
                console.error(
                  "Error removing expired VIP status:",
                  updateError
                );
                // Continue with local state update even if Firebase update fails
              }
              setIsVip(false);
              setVipExpiresAt(null);
              setDaysRemaining(0);
            } else if (roles.includes("vip") && expiry) {
              // VIP er aktiv
              setIsVip(true);
              setVipExpiresAt(expiry);
              const remaining = Math.max(
                0,
                Math.ceil((expiry - now) / (24 * 60 * 60 * 1000))
              );
              setDaysRemaining(remaining);
            } else {
              // Ikke VIP
              setIsVip(false);
              setVipExpiresAt(null);
              setDaysRemaining(0);
            }
          } else {
            // User document doesn't exist
            setIsVip(false);
            setVipExpiresAt(null);
            setDaysRemaining(0);
          }
        } catch (error) {
          console.error("Error checking VIP status:", error);
          // On error, assume non-VIP to prevent issues
          setIsVip(false);
          setVipExpiresAt(null);
          setDaysRemaining(0);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to VIP status:", error);
        setLoading(false);
        // On listener error, set safe defaults
        setIsVip(false);
        setVipExpiresAt(null);
        setDaysRemaining(0);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    isVip,
    vipExpiresAt,
    daysRemaining,
    loading,
  };
};

export default useVipStatus;
