// Stats from users collection with cache + polling to reduce reads (was: onSnapshot on full collection).
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { cacheHelpers } from "../utils/firebaseCache";

const CACHE_TTL_MS = 3 * 60 * 1000;
let lastFetch = 0;
let cachedStats = null;

const fetchStats = async () => {
  const cached = cacheHelpers.getUserStats();
  if (cached && (cached.totalUsers > 0 || cached.onlineUsers >= 0) && Date.now() - lastFetch < CACHE_TTL_MS) {
    return cached;
  }
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const toMillis = (u) => (u.lastActive?.toMillis ? u.lastActive.toMillis() : u.lastActive);
  const onlineUsers = users.filter((u) => u.lastActive && toMillis(u) > fiveMinutesAgo).length;
  const dailyActiveUsers = users.filter((u) => u.lastActive && toMillis(u) > twentyFourHoursAgo).length;
  const stats = { onlineUsers, totalUsers: users.length, dailyActiveUsers };
  lastFetch = Date.now();
  cacheHelpers.setUserStats(stats);
  return stats;
};

const useUserStats = () => {
  const [stats, setStats] = useState(cacheHelpers.getUserStats() || { onlineUsers: 0, totalUsers: 0, dailyActiveUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((s) => {
        if (!cancelled) {
          cachedStats = s;
          setStats(s);
        }
      })
      .catch(() => {
        if (!cancelled) setStats((prev) => prev);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const interval = setInterval(() => {
      fetchStats().then((s) => !cancelled && setStats(s));
    }, CACHE_TTL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading };
};

export default useUserStats;
