// Simple cache for user statistics that works without authentication
console.log('🔥🔥🔥 USERSTATSCACHE.JS LOADED! 🔥🔥🔥');
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

let statsCache = {
  onlineUsers: 0,
  totalUsers: 0,
  dailyActiveUsers: 0
};

let listeners = [];
let isListening = false;

const updateStats = (newStats) => {
  statsCache = newStats;
  listeners.forEach(callback => callback(newStats));
};

const startListening = () => {
  if (isListening) return;
  
  console.log('UserStatsCache: Starting Firebase listener...');
  isListening = true;
  
  try {
    const usersRef = collection(db, 'users');
    
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      console.log('UserStatsCache: Firebase snapshot received');
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('UserStats Cache: Fetched users:', users.length);
      
      // Calculate online users (last seen within 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const onlineUsers = users.filter(u => u.lastSeen && u.lastSeen > fiveMinutesAgo).length;
      
      // Calculate daily active users (last seen within 24 hours)
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      const dailyActiveUsers = users.filter(u => u.lastSeen && u.lastSeen > twentyFourHoursAgo).length;
      
      // Total registered users
      const totalUsers = users.length;
      
      console.log('UserStats Cache: Online:', onlineUsers, 'Daily Active:', dailyActiveUsers, 'Total:', totalUsers);
      
      updateStats({
        onlineUsers,
        totalUsers,
        dailyActiveUsers
      });
    }, (error) => {
      console.error('UserStatsCache: Firebase error:', error);
      // Fallback to mock data on error
      updateStats({
        onlineUsers: 8,
        totalUsers: 142,
        dailyActiveUsers: 32
      });
    });

    // Store unsubscribe function globally
    window.userStatsUnsubscribe = unsubscribe;
  } catch (error) {
    console.error('UserStatsCache: Failed to start listener:', error);
    // Fallback to mock data
    updateStats({
      onlineUsers: 8,
      totalUsers: 142,
      dailyActiveUsers: 32
    });
  }
};

// Start listening when module is imported
if (typeof window !== 'undefined') {
  console.log('UserStatsCache: Module loaded, starting listener...');
  startListening();
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
