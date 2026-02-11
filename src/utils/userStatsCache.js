// Simple cache for user statistics that works without authentication.
// Uses cache TTL to avoid refetching entire users collection on every refresh.
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { cacheHelpers } from './firebaseCache';

let statsCache = {
  onlineUsers: 0,
  totalUsers: 0,
  dailyActiveUsers: 0
};

let listeners = [];

const updateStats = (newStats) => {
  statsCache = newStats;
  cacheHelpers.setUserStats(newStats);
  listeners.forEach(callback => callback(newStats));
};

const fetchUserStats = async () => {
  const cached = cacheHelpers.getUserStats();
  if (cached && (cached.totalUsers > 0 || cached.onlineUsers >= 0)) {
    updateStats(cached);
    return;
  }
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    
    // Calculate online users (last active within 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const onlineUsers = users.filter(u => {
      if (!u.lastActive) return false;
      // Handle different timestamp formats
      const lastActiveTime = u.lastActive.toMillis ? u.lastActive.toMillis() : u.lastActive;
      return lastActiveTime > fiveMinutesAgo;
    }).length;
    
    // Calculate daily active users (last active within 24 hours)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const dailyActiveUsers = users.filter(u => {
      if (!u.lastActive) return false;
      // Handle different timestamp formats
      const lastActiveTime = u.lastActive.toMillis ? u.lastActive.toMillis() : u.lastActive;
      return lastActiveTime > twentyFourHoursAgo;
    }).length;
    
    // Total registered users
    const totalUsers = users.length;
    
    
    updateStats({
      onlineUsers,
      totalUsers,
      dailyActiveUsers
    });
  } catch (error) {
    // Keep current stats on error
  }
};

// Initial fetch when module loads (respects cache TTL on subsequent imports)
if (typeof window !== 'undefined') {
  fetchUserStats();
}

export const subscribeToStats = (callback) => {
  listeners.push(callback);
  // Immediately call with current stats
  callback(statsCache);
  
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
};

export const getCurrentStats = () => statsCache;

// Force refresh stats
export const refreshStats = () => {
  fetchUserStats();
};
