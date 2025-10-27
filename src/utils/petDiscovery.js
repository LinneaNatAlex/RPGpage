import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import shopItems from '../Components/Shop/itemsList';

// Pet discovery system - pets find random items from shop
export class PetDiscoverySystem {
  constructor() {
    this.discoveryCooldown = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    this.maxDiscoveriesPerDay = 3; // 3 discoveries per day
    this.maxPendingDiscoveries = 3; // Maximum 3 pending discoveries at once
    this.dailyDiscoveryChance = 0.3; // 30% chance per day to have any discoveries
    this.discoveryChancePerAttempt = 0.15; // 15% chance per discovery attempt
  }

  // Calculate discovery chance based on item price
  calculateDiscoveryChance(item) {
    const price = item.price || 0;
    
    // Higher price = lower chance
    if (price >= 50000) return 0.001; // 0.1% chance for very expensive items
    if (price >= 10000) return 0.005;   // 0.5% chance for expensive items
    if (price >= 5000) return 0.01;    // 1% chance for moderately expensive items
    if (price >= 1000) return 0.05;     // 5% chance for mid-range items
    if (price >= 100) return 0.15;     // 15% chance for cheap items
    return 0.25; // 25% chance for very cheap items
  }

  // Get all available items from shop (excluding pets and pet items)
  getAvailableItems() {
    const allItems = [...shopItems];
    
    // Filter out pets and pet items
    return allItems.filter(item => 
      item.category !== 'Pets' && 
      item.category !== 'Pet Items' &&
      item.type !== 'pet' &&
      item.type !== 'petFood'
    );
  }

  // Get items with reduced potion probability
  getAvailableItemsWithReducedPotions() {
    const allItems = this.getAvailableItems();
    
    // Reduce potion probability by filtering out most potions
    return allItems.filter(item => {
      // Keep only basic potions, filter out most effect potions
      if (item.type === 'potion') {
        // Only allow basic potions (healing, mana, etc.) - filter out effect potions
        const basicPotions = ['Healing Potion', 'Mana Potion', 'Stamina Potion'];
        return basicPotions.includes(item.name);
      }
      return true; // Keep all non-potion items
    });
  }

  // Get items with extremely reduced potion probability (1 in 1000)
  getAvailableItemsWithMinimalPotions() {
    const allItems = this.getAvailableItems();
    
    // Drastically reduce potion probability - only 1 in 1000 chance
    return allItems.filter(item => {
      if (item.type === 'potion') {
        // Only 1 in 1000 chance for any potion
        return Math.random() < 0.001;
      }
      return true; // Keep all non-potion items
    });
  }

  // Select a random item based on rarity
  selectRandomItem() {
    const availableItems = this.getAvailableItemsWithMinimalPotions();
    const weightedItems = [];

    availableItems.forEach(item => {
      const chance = this.calculateDiscoveryChance(item);
      const weight = Math.floor(chance * 1000); // Convert to integer weight
      
      // Add item multiple times based on its weight
      for (let i = 0; i < weight; i++) {
        weightedItems.push(item);
      }
    });

    if (weightedItems.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * weightedItems.length);
    return weightedItems[randomIndex];
  }

  // Check if user can have a discovery (cooldown, daily limit, and pending limit)
  async canHaveDiscovery(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      const now = Date.now();
      
      // Check cooldown
      const lastDiscovery = userData.lastPetDiscovery || 0;
      if (now - lastDiscovery < this.discoveryCooldown) {
        return false;
      }
      
      // Check daily limit
      const today = new Date().toDateString();
      const discoveryCount = userData.petDiscoveriesToday || 0;
      const lastDiscoveryDate = userData.lastDiscoveryDate;
      
      if (lastDiscoveryDate === today && discoveryCount >= this.maxDiscoveriesPerDay) {
        return false;
      }
      
      // Check pending discoveries limit
      const pendingDiscoveries = userData.pendingPetDiscoveries || [];
      if (pendingDiscoveries.length >= this.maxPendingDiscoveries) {
        return false;
      }
      
      // Check if pet has HP (not fainted)
      if (userData.currentPet && userData.currentPet.health <= 0) {
        return false; // Pet is fainted, can't discover anything
      }
      
      // Check if it's a new day and apply daily discovery chance
      if (lastDiscoveryDate !== today) {
        // New day - check if user gets any discoveries today
        const dailyRoll = Math.random();
        if (dailyRoll > this.dailyDiscoveryChance) {
          return false; // No discoveries today
        }
      }
      
      // Apply discovery chance per attempt
      const attemptRoll = Math.random();
      if (attemptRoll > this.discoveryChancePerAttempt) {
        return false; // This attempt fails
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Test method that bypasses all limits
  async triggerTestDiscovery(userId, petName) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      const currentPet = userData.currentPet;
      
      if (!currentPet) {
        return null;
      }
      
      // Check if pet has HP (not fainted) - even test discoveries should respect this
      if (currentPet.health <= 0) {
        return null; // Pet is fainted, can't discover anything
      }
      
      // Check if user has Lucky Potion effect
      const now = Date.now();
      const luckyUntil = userData.luckyUntil || 0;
      const hasLuckyEffect = luckyUntil > now;
      
      // Select a random item (bypass all limits)
      // If Lucky Potion is active, increase chance of rare items
      const selectedItem = hasLuckyEffect ? this.selectLuckyItem() : this.selectRandomItem();
      if (!selectedItem) {
        return null;
      }
      
      // Generate a story for this discovery
      const stories = [
        `${petName} found this behind an old chair.`,
        `${petName} discovered this in a dusty corner.`,
        `${petName} found this under loose floorboards.`,
        `${petName} discovered this buried under leaves.`,
        `${petName} found this in an abandoned classroom.`,
        `${petName} discovered this in a forgotten chest.`,
        `${petName} found this behind a tapestry.`,
        `${petName} discovered this in a secret compartment.`,
        `${petName} found this in the potions classroom.`,
        `${petName} discovered this under the stairs.`
      ];
      const story = stories[Math.floor(Math.random() * stories.length)];
      
      // Add to pending discoveries
      const pendingDiscoveries = userData.pendingPetDiscoveries || [];
      pendingDiscoveries.push({
        item: selectedItem,
        petName: petName,
        timestamp: Date.now(),
        story: story,
        luckyEffect: hasLuckyEffect // Mark if found with Lucky Potion
      });
      
      await updateDoc(userRef, {
        pendingPetDiscoveries: pendingDiscoveries
      });
      
      return {
        item: selectedItem,
        petName: petName,
        luckyEffect: hasLuckyEffect
      };
    } catch (error) {
      return null;
    }
  }

  // Select item with Lucky Potion effect (higher chance for rare items)
  selectLuckyItem() {
    const items = [...this.shopItems];
    
    // Sort items by price (rare items are more expensive)
    items.sort((a, b) => (b.price || 0) - (a.price || 0));
    
    // Create weighted selection favoring expensive/rare items
    const weights = items.map((item, index) => {
      const baseWeight = 1;
      const rarityBonus = Math.pow(2, index / 10); // Exponential bonus for rarer items
      return baseWeight * rarityBonus;
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      if (random < weights[i]) {
        return items[i];
      }
      random -= weights[i];
    }
    
    // Fallback to first item
    return items[0];
  }

  // Trigger a pet discovery
  async triggerDiscovery(userId, petName) {
    try {
      // Check if user can have a discovery
      const canDiscover = await this.canHaveDiscovery(userId);
      if (!canDiscover) return null;

      // Select random item
      const discoveredItem = this.selectRandomItem();
      if (!discoveredItem) return null;

      // Create discovery notification
      const discoveryData = {
        userId,
        petName,
        item: discoveredItem,
        timestamp: Date.now(),
        status: 'pending' // pending, accepted, declined
      };

      // Save discovery to user's pending discoveries
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      const pendingDiscoveries = userData.pendingPetDiscoveries || [];
      
      // Add new discovery
      pendingDiscoveries.push(discoveryData);
      
      // Update user data
      const now = Date.now();
      const today = new Date().toDateString();
      const lastDiscoveryDate = userData.lastDiscoveryDate;
      const discoveryCount = (lastDiscoveryDate === today) ? (userData.petDiscoveriesToday || 0) : 0;
      
      await updateDoc(userRef, {
        pendingPetDiscoveries: pendingDiscoveries,
        lastPetDiscovery: now,
        lastDiscoveryDate: today,
        petDiscoveriesToday: discoveryCount + 1
      });

      return discoveryData;
    } catch (error) {
      return null;
    }
  }

  // Accept a discovery
  async acceptDiscovery(userId, discoveryIndex) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      const pendingDiscoveries = userData.pendingPetDiscoveries || [];
      
      if (discoveryIndex >= pendingDiscoveries.length) return false;
      
      const discovery = pendingDiscoveries[discoveryIndex];
      const item = discovery.item;
      
      // Add item to inventory
      let inventory = userData.inventory || [];
      const existingItemIndex = inventory.findIndex(i => i.name === item.name);
      
      if (existingItemIndex >= 0) {
        inventory[existingItemIndex].qty = (inventory[existingItemIndex].qty || 1) + 1;
      } else {
        inventory.push({
          ...item,
          qty: 1,
          discoveredBy: discovery.petName,
          discoveredAt: discovery.timestamp
        });
      }
      
      // Remove from pending discoveries
      pendingDiscoveries.splice(discoveryIndex, 1);
      
      // Update user data
      await updateDoc(userRef, {
        inventory,
        pendingPetDiscoveries: pendingDiscoveries
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Decline a discovery
  async declineDiscovery(userId, discoveryIndex) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      const pendingDiscoveries = userData.pendingPetDiscoveries || [];
      
      if (discoveryIndex >= pendingDiscoveries.length) return false;
      
      // Remove from pending discoveries
      pendingDiscoveries.splice(discoveryIndex, 1);
      
      // Update user data
      await updateDoc(userRef, {
        pendingPetDiscoveries: pendingDiscoveries
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get pending discoveries for user
  async getPendingDiscoveries(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return [];
      
      const userData = userDoc.data();
      return userData.pendingPetDiscoveries || [];
    } catch (error) {
      return [];
    }
  }

  // Check if user has active pet
  async hasActivePet(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      return !!userData.currentPet;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const petDiscovery = new PetDiscoverySystem();
