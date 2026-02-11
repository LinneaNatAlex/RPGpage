// Firebase caching utility to reduce quota usage
// This cache system reduces Firebase reads by storing frequently accessed data locally

class FirebaseCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = {
      USER_DATA: 5 * 60 * 1000, // 5 minutes for user data
      INVENTORY: 2 * 60 * 1000, // 2 minutes for inventory
      NOTIFICATIONS: 30 * 1000, // 30 seconds for notifications
      ONLINE_USERS: 30 * 1000, // 30 seconds for online users
      SHOP_ITEMS: 10 * 60 * 1000, // 10 minutes for shop items
      BOOKS: 15 * 60 * 1000, // 15 minutes for books
      USERS_LIST: 5 * 60 * 1000, // 5 minutes for full users list (reduces reads)
      USER_STATS: 3 * 60 * 1000, // 3 minutes for online/total stats
    };
  }

  // Generate cache key
  getCacheKey(type, userId = null, extra = null) {
    if (userId && extra) return `${type}_${userId}_${extra}`;
    if (userId) return `${type}_${userId}`;
    return type;
  }

  // Check if cache is valid
  isCacheValid(cacheItem, cacheType) {
    if (!cacheItem) return false;
    const now = Date.now();
    const duration = this.CACHE_DURATION[cacheType] || 60000; // Default 1 minute
    return now - cacheItem.timestamp < duration;
  }

  // Get data from cache
  get(type, userId = null, extra = null) {
    const key = this.getCacheKey(type, userId, extra);
    const cached = this.cache.get(key);

    if (this.isCacheValid(cached, type)) {
      return cached.data;
    }

    return null;
  }

  // Set data in cache
  set(type, data, userId = null, extra = null) {
    const key = this.getCacheKey(type, userId, extra);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Clear cache for specific type
  clear(type, userId = null, extra = null) {
    const key = this.getCacheKey(type, userId, extra);
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.entries())).length,
    };
  }
}

// Create singleton instance
const firebaseCache = new FirebaseCache();

// Helper functions for common cache operations
export const cacheHelpers = {
  // Cache user data
  getUserData: (userId) => firebaseCache.get("USER_DATA", userId),
  setUserData: (userId, data) => firebaseCache.set("USER_DATA", data, userId),

  // Cache inventory
  getInventory: (userId) => firebaseCache.get("INVENTORY", userId),
  setInventory: (userId, data) => firebaseCache.set("INVENTORY", data, userId),

  // Cache notifications
  getNotifications: (userId) => firebaseCache.get("NOTIFICATIONS", userId),
  setNotifications: (userId, data) =>
    firebaseCache.set("NOTIFICATIONS", data, userId),

  // Cache online users
  getOnlineUsers: () => firebaseCache.get("ONLINE_USERS"),
  setOnlineUsers: (data) => firebaseCache.set("ONLINE_USERS", data),

  // Cache shop items
  getShopItems: () => firebaseCache.get("SHOP_ITEMS"),
  setShopItems: (data) => firebaseCache.set("SHOP_ITEMS", data),

  // Cache books
  getBooks: () => firebaseCache.get("BOOKS"),
  setBooks: (data) => firebaseCache.set("BOOKS", data),

  // Cache users list (leaderboard etc.) – single shared fetch reduces reads
  getUsersList: () => firebaseCache.get("USERS_LIST"),
  setUsersList: (data) => firebaseCache.set("USERS_LIST", data),
  clearUsersList: () => firebaseCache.clear("USERS_LIST"),

  // Cache user stats (online/total)
  getUserStats: () => firebaseCache.get("USER_STATS"),
  setUserStats: (data) => firebaseCache.set("USER_STATS", data),

  // Clear user-specific cache (useful when user logs out or data updates)
  clearUserCache: (userId) => {
    firebaseCache.clear("USER_DATA", userId);
    firebaseCache.clear("INVENTORY", userId);
    firebaseCache.clear("NOTIFICATIONS", userId);
  },

  // Get cache statistics
  getStats: () => firebaseCache.getStats(),
};

export default firebaseCache;
