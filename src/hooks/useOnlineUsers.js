// Første hent med getDocs (viser med en gang), deretter onSnapshot for live-oppdateringer.
// Ingen lesing når online-boksen er lukket.
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useOnlineListContext } from "../context/onlineListContext";

const RECENT_MS = 3 * 60 * 1000; // 3 min – kun brukere som har vært aktive akkurat nå

const toMillis = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (v && typeof v.toMillis === "function") return v.toMillis();
  if (v && typeof v.toDate === "function") return v.toDate().getTime();
  return 0;
};

const processSnapshot = (snapshot) => {
  const now = Date.now();
  const cutoff = now - RECENT_MS;
  const docs = snapshot.docs || [];
  return docs
    .map((docSnap) => {
      const data = docSnap.data();
      return { ...data, id: docSnap.id };
    })
    .filter((u) => !u.invisibleUntil || u.invisibleUntil < now)
    .filter((u) => {
      const lastActive = toMillis(u.lastActive) || 0;
      const lastLogin = toMillis(u.lastLogin) || 0;
      const lastSeen = Math.max(lastActive, lastLogin);
      return lastSeen >= cutoff;
    })
    .filter((u) => {
      const name = (u.displayName && String(u.displayName).trim()) || "";
      const email = (u.email && String(u.email).trim()) || "";
      return name.length > 0 || email.length > 0;
    });
};

const useOnlineUsers = () => {
  const { enabled } = useOnlineListContext();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "users"),
      where("online", "==", true),
    );

    let unsubSnapshot = () => {};

    const run = async () => {
      try {
        const snapshot = await getDocs(q);
        setOnlineUsers(processSnapshot(snapshot));
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.warn("useOnlineUsers getDocs error:", err);
      } finally {
        setLoading(false);
      }
    };
    run();

    unsubSnapshot = onSnapshot(
      q,
      (snapshot) => setOnlineUsers(processSnapshot(snapshot)),
      (err) => {
        if (process.env.NODE_ENV === "development")
          console.warn("useOnlineUsers onSnapshot error:", err);
      }
    );

    return () => unsubSnapshot();
  }, [enabled]);

  return { onlineUsers, loading };
};
export default useOnlineUsers;
