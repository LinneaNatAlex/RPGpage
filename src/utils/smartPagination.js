// Smart pagination utility for Firebase collections
// This utility implements efficient pagination to reduce Firebase reads

import {
  query,
  collection,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

class SmartPaginator {
  constructor(collectionName, pageSize = 10) {
    this.collectionName = collectionName;
    this.pageSize = pageSize;
    this.cache = new Map(); // Page cache
    this.lastDocCache = new Map(); // Last document cache for pagination
    this.totalCache = null; // Total count cache
    this.orderField = "createdAt";
    this.orderDirection = "desc";
  }

  // Set ordering
  setOrder(field, direction = "desc") {
    this.orderField = field;
    this.orderDirection = direction;
    this.clearCache(); // Clear cache when order changes
  }

  // Get a specific page with caching
  async getPage(pageNumber = 1) {
    const cacheKey = `${this.collectionName}_${pageNumber}_${this.orderField}_${this.orderDirection}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(
        `📖 Using cached page ${pageNumber} for ${this.collectionName}`
      );
      return this.cache.get(cacheKey);
    }

    try {
      let q;

      if (pageNumber === 1) {
        // First page - simple limit
        q = query(
          collection(db, this.collectionName),
          orderBy(this.orderField, this.orderDirection),
          limit(this.pageSize)
        );
      } else {
        // Subsequent pages - use pagination
        const lastDocKey = `${this.collectionName}_${pageNumber - 1}`;
        let lastDoc = this.lastDocCache.get(lastDocKey);

        if (!lastDoc) {
          // If we don't have the last document, we need to get the previous page first
          await this.getPage(pageNumber - 1);
          lastDoc = this.lastDocCache.get(lastDocKey);
        }

        if (!lastDoc) {
          throw new Error(
            `Cannot paginate to page ${pageNumber} without previous page data`
          );
        }

        q = query(
          collection(db, this.collectionName),
          orderBy(this.orderField, this.orderDirection),
          startAfter(lastDoc),
          limit(this.pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Cache the results
      this.cache.set(cacheKey, docs);

      // Cache the last document for pagination
      if (snapshot.docs.length > 0) {
        const lastDocKey = `${this.collectionName}_${pageNumber}`;
        this.lastDocCache.set(
          lastDocKey,
          snapshot.docs[snapshot.docs.length - 1]
        );
      }

      console.log(
        `📥 Loaded page ${pageNumber} for ${this.collectionName} (${docs.length} items)`
      );
      return docs;
    } catch (error) {
      console.error(
        `Error loading page ${pageNumber} for ${this.collectionName}:`,
        error
      );
      return [];
    }
  }

  // Get multiple pages at once (for infinite scroll)
  async getPages(startPage = 1, endPage = 1) {
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      const pageData = await this.getPage(i);
      pages.push({ page: i, data: pageData });
    }
    return pages;
  }

  // Clear all caches
  clearCache() {
    this.cache.clear();
    this.lastDocCache.clear();
    this.totalCache = null;
    console.log(`🗑️ Cleared cache for ${this.collectionName}`);
  }

  // Prefetch next page for better UX
  async prefetchNext(currentPage) {
    setTimeout(() => {
      this.getPage(currentPage + 1);
    }, 1000); // Prefetch after 1 second
  }

  // Get total count (cached)
  async getTotalCount() {
    if (this.totalCache !== null) {
      return this.totalCache;
    }

    // This is expensive, so we cache it aggressively
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      this.totalCache = snapshot.size;

      // Cache expires after 5 minutes
      setTimeout(() => {
        this.totalCache = null;
      }, 5 * 60 * 1000);

      return this.totalCache;
    } catch (error) {
      console.error(
        `Error getting total count for ${this.collectionName}:`,
        error
      );
      return 0;
    }
  }

  // Calculate total pages
  async getTotalPages() {
    const totalCount = await this.getTotalCount();
    return Math.ceil(totalCount / this.pageSize);
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cachedPages: this.cache.size,
      lastDocsCached: this.lastDocCache.size,
      totalCountCached: this.totalCache !== null,
      cacheKeys: Array.from(this.cache.keys()),
    };
  }
}

// Create pre-configured paginators for common collections
export const paginators = {
  messages: new SmartPaginator("messages", 50),
  rpgGrateHall: new SmartPaginator("rpgGrateHall", 50),
  books: new SmartPaginator("books", 20),
  news: new SmartPaginator("news", 15),
  notifications: new SmartPaginator("notifications", 25),
  shopItems: new SmartPaginator("shopItems", 30),
};

// Helper functions
export const paginationHelpers = {
  // Get paginated messages
  getMessages: (page = 1) => paginators.messages.getPage(page),

  // Get paginated RPG messages
  getRPGMessages: (page = 1) => paginators.rpgGrateHall.getPage(page),

  // Get paginated books
  getBooks: (page = 1) => paginators.books.getPage(page),

  // Get paginated news
  getNews: (page = 1) => paginators.news.getPage(page),

  // Get paginated shop items
  getShopItems: (page = 1) => paginators.shopItems.getPage(page),

  // Clear all caches
  clearAllCaches: () => {
    Object.values(paginators).forEach((paginator) => paginator.clearCache());
  },

  // Get all cache stats
  getAllStats: () => {
    const stats = {};
    Object.entries(paginators).forEach(([name, paginator]) => {
      stats[name] = paginator.getCacheStats();
    });
    return stats;
  },
};

export default SmartPaginator;
