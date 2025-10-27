import { petDiscovery } from './petDiscovery';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Pet Discovery Scheduler - runs in background to trigger discoveries
export class PetDiscoveryScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 30 * 60 * 1000; // Check every 30 minutes
  }

  // Start the scheduler
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Run immediately, then on interval
    this.checkForDiscoveries();
    this.intervalId = setInterval(() => {
      this.checkForDiscoveries();
    }, this.checkInterval);
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  // Check for users who should get discoveries
  async checkForDiscoveries() {
    try {
      
      // Get all users with active pets
      const usersWithPets = await this.getUsersWithActivePets();
      
      for (const user of usersWithPets) {
        try {
          // Check if user can have a discovery
          const canDiscover = await petDiscovery.canHaveDiscovery(user.uid);
          
          if (canDiscover) {
            // Random chance to trigger discovery (50% chance per check for testing)
            const shouldDiscover = Math.random() < 0.5;
            
            if (shouldDiscover) {
              await petDiscovery.triggerDiscovery(user.uid, user.currentPet.name);
            }
          }
        } catch (error) {
        }
      }
      
    } catch (error) {
    }
  }

  // Get all users with active pets
  async getUsersWithActivePets() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('currentPet', '!=', null));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      return [];
    }
  }

  // Manual trigger for testing
  async triggerTestDiscovery(userId) {
    try {
      const discovery = await petDiscovery.triggerDiscovery(userId, 'Test Pet');
      return discovery;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const petDiscoveryScheduler = new PetDiscoveryScheduler();

// Auto-start scheduler when module loads
if (typeof window !== 'undefined') {
  // Only start in browser environment
  petDiscoveryScheduler.start();
}
