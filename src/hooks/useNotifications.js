import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { cacheHelpers } from "../utils/firebaseCache";

/**
 * Hook for notifications + recent news (unseen).
 * Used by TopBar and MobileLayout.
 * @param {{ uid: string } | null} user - current auth user
 * @param {{ lastSeenNewsAt?: number } | null} userData - user doc (for lastSeenNewsAt)
 */
export default function useNotifications(user, userData) {
  const [notifications, setNotifications] = useState([]);
  const [recentNews, setRecentNews] = useState([]);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef,
      where("to", "==", user.uid),
      limit(80)
    );
    const applySnapshot = (snap) => {
      const byTo = (snap.docs || []).map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          _sort: data.created ?? data.createdAt?.toMillis?.() ?? 0,
        };
      });
      byTo.sort((a, b) => (b._sort || 0) - (a._sort || 0));
      const list = byTo.slice(0, 50).map(({ _sort, ...n }) => n);
      setNotifications(list);
      cacheHelpers.setNotifications(user.uid, list.filter((n) => !n.read));
    };
    const unsub = onSnapshot(
      q,
      (snap) => applySnapshot(snap),
      (err) => {
        console.error("Notifications listener error:", err);
        setNotifications([]);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !userData) {
      setRecentNews([]);
      return;
    }
    const lastSeen = userData.lastSeenNewsAt ?? 0;
    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    getDocs(q)
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.type === "nyhet")
          .filter((item) => {
            const t = item.createdAt?.toMillis?.() ?? item.createdAt ?? 0;
            return t > lastSeen;
          });
        setRecentNews(list);
      })
      .catch(() => setRecentNews([]));
  }, [user?.uid, userData?.lastSeenNewsAt]);

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { read: true })
        )
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      cacheHelpers.setNotifications(user.uid, []);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const unreadCount =
    notifications.filter((n) => !n.read).length + recentNews.length;

  return {
    notifications,
    recentNews,
    markAllAsRead,
    unreadCount,
  };
}
