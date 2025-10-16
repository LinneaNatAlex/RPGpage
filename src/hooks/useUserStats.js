import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

// Hook to get user statistics for public display (works for non-authenticated users)
const useUserStats = () => {
  const [stats, setStats] = useState({
    onlineUsers: 0,
    totalUsers: 0,
    dailyActiveUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('UserStats: Fetched users:', users.length);
      
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
      
      console.log('UserStats: Online:', onlineUsers, 'Daily Active:', dailyActiveUsers, 'Total:', totalUsers);
      
      setStats({
        onlineUsers,
        totalUsers,
        dailyActiveUsers
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching user stats:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
};

export default useUserStats;
