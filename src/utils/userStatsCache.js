// Simple cache for user statistics that works without authentication
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

let statsCache = {
  onlineUsers: 0,
  totalUsers: 0,
  dailyActiveUsers: 0
};

let listeners = [];
let hasFetched = false;

const updateStats = (newStats) => {
  statsCache = newStats;
  listeners.forEach(callback => callback(newStats));
};

const fetchUserStats = async () => {
  
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
    console.error('UserStatsCache: Error fetching stats:', error);
    // Keep current stats on error
  }
};

// Fetch stats when module is imported (only once)
if (typeof window !== 'undefined' && !hasFetched) {
  hasFetched = true;
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
