import { PetDiscoverySystem } from './petDiscovery';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const petDiscovery = new PetDiscoverySystem();

// Check if user has had discoveries today
const hasDiscoveriesToday = (userData) => {
  const today = new Date().toDateString();
  const lastDiscoveryDate = userData.lastDiscoveryDate;
  const discoveryCount = userData.petDiscoveriesToday || 0;
  
  return lastDiscoveryDate === today && discoveryCount >= 3;
};

// Reset daily discovery count if it's a new day
const resetDailyCountIfNeeded = async (userRef, userData) => {
  const today = new Date().toDateString();
  const lastDiscoveryDate = userData.lastDiscoveryDate;
  
  if (lastDiscoveryDate !== today) {
    await updateDoc(userRef, {
      petDiscoveriesToday: 0,
      lastDiscoveryDate: today
    });
    return true; // Reset happened
  }
  return false; // No reset needed
};

// Trigger a discovery for a user
const triggerUserDiscovery = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    
    // Check if user has active pet
    if (!userData.currentPet) return false;
    
    // Reset daily count if new day
    await resetDailyCountIfNeeded(userRef, userData);
    
    // Check if user can have more discoveries today
    if (hasDiscoveriesToday(userData)) return false;
    
    // Check pending discoveries limit
    const pendingDiscoveries = userData.pendingPetDiscoveries || [];
    if (pendingDiscoveries.length >= 3) return false;
    
    // Trigger discovery using test method (bypasses cooldown)
    const discovery = await petDiscovery.triggerTestDiscovery(user.uid, userData.currentPet.name);
    
    if (discovery) {
      // Update daily count
      const newCount = (userData.petDiscoveriesToday || 0) + 1;
      await updateDoc(userRef, {
        petDiscoveriesToday: newCount,
        lastDiscoveryDate: new Date().toDateString()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error triggering discovery for ${user.uid}:`, error);
    return false;
  }
};

// Get all users with active pets
const getUsersWithActivePets = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('currentPet', '!=', null));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error getting users with pets:', error);
    return [];
  }
};

// Main scheduler function
const runDailyDiscoveryScheduler = async () => {
  
  try {
    const users = await getUsersWithActivePets();
    
    if (users.length === 0) {
      return;
    }
    
    const results = [];
    for (const user of users) {
      const success = await triggerUserDiscovery(user);
      results.push({ userId: user.uid, success });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return results;
  } catch (error) {
    console.error('Error in daily discovery scheduler:', error);
    return [];
  }
};

// Schedule discoveries throughout the day
const scheduleDailyDiscoveries = () => {
  
  // Don't run immediately - let it run on schedule
  // Schedule to run every 2 hours (12 times per day)
  // This gives users multiple chances to get their 3 discoveries
  setInterval(runDailyDiscoveryScheduler, 2 * 60 * 60 * 1000); // 2 hours
  
};

// Start the scheduler when module loads (only if not already running)
if (typeof window !== 'undefined' && !window.petDiscoverySchedulerRunning) {
  window.petDiscoverySchedulerRunning = true;
  scheduleDailyDiscoveries();
}

export { runDailyDiscoveryScheduler, scheduleDailyDiscoveries };