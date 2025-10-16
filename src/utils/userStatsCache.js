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
  console.log('UserStatsCache: Updating stats from:', statsCache, 'to:', newStats);
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
      
      // Debug: Log sample user data
      if (users.length > 0) {
        console.log('Sample user data:', {
          id: users[0].id,
          lastActive: users[0].lastActive,
          lastActiveType: typeof users[0].lastActive,
          hasToMillis: users[0].lastActive?.toMillis ? 'yes' : 'no'
        });
      }
      
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
      
      console.log('UserStats Cache: Online:', onlineUsers, 'Daily Active:', dailyActiveUsers, 'Total:', totalUsers);
      console.log('UserStats Cache: Sample user lastActive values:', users.slice(0, 3).map(u => ({
        id: u.id,
        lastActive: u.lastActive,
        lastActiveType: typeof u.lastActive
      })));
      
      updateStats({
        onlineUsers,
        totalUsers,
        dailyActiveUsers
      });
    }, (error) => {
      console.error('UserStatsCache: Firebase error:', error);
      console.log('UserStatsCache: Firebase error occurred, keeping current stats');
      // Don't update stats on error - keep current values
    });

    // Store unsubscribe function globally
    window.userStatsUnsubscribe = unsubscribe;
  } catch (error) {
    console.error('UserStatsCache: Failed to start listener:', error);
    console.log('UserStatsCache: Failed to start listener, keeping current stats');
    // Don't update stats on error - keep current values
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

// Force refresh stats
export const refreshStats = () => {
  console.log('UserStatsCache: Forcing stats refresh...');
  if (window.userStatsUnsubscribe) {
    window.userStatsUnsubscribe();
    isListening = false;
  }
  startListening();
};
