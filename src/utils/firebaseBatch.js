// Firebase batch operations utility to reduce Firebase writes
// This utility batches multiple writes into single transactions

import {
  writeBatch,
  doc,
  updateDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

class FirebaseBatchManager {
  constructor() {
    this.pendingUpdates = new Map(); // userId -> { field: value, ... }
    this.batchTimeout = null;
    this.BATCH_DELAY = 2000; // 2 seconds delay before executing batch
    this.MAX_BATCH_SIZE = 500; // Firebase batch limit
  }

  // Queue an update for a user document
  queueUserUpdate(userId, updates) {
    if (!this.pendingUpdates.has(userId)) {
      this.pendingUpdates.set(userId, {});
    }

    // Merge updates
    const existing = this.pendingUpdates.get(userId);
    this.pendingUpdates.set(userId, { ...existing, ...updates });

    console.log(`📝 Queued update for user ${userId}:`, updates);

    // Schedule batch execution
    this.scheduleBatchExecution();
  }

  // Schedule batch execution with debouncing
  scheduleBatchExecution() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.BATCH_DELAY);
  }

  // Execute the batched updates
  async executeBatch() {
    if (this.pendingUpdates.size === 0) return;

    console.log(`🚀 Executing batch with ${this.pendingUpdates.size} updates`);

    try {
      const batch = writeBatch(db);
      let operationCount = 0;

      for (const [userId, updates] of this.pendingUpdates.entries()) {
        if (operationCount >= this.MAX_BATCH_SIZE) {
          console.warn(
            "⚠️ Batch size limit reached, splitting into multiple batches"
          );
          break;
        }

        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
          ...updates,
          lastUpdated: Date.now(),
        });

        operationCount++;
      }

      await batch.commit();
      console.log(
        `✅ Batch executed successfully with ${operationCount} operations`
      );

      // Clear processed updates
      const processedUserIds = Array.from(this.pendingUpdates.keys()).slice(
        0,
        operationCount
      );
      for (const userId of processedUserIds) {
        this.pendingUpdates.delete(userId);
      }

      // If there are remaining updates, schedule another batch
      if (this.pendingUpdates.size > 0) {
        this.scheduleBatchExecution();
      }
    } catch (error) {
      console.error("❌ Batch execution failed:", error);
      // Keep updates for retry
      setTimeout(() => this.executeBatch(), 5000); // Retry after 5 seconds
    }
  }

  // Force immediate execution of pending batches
  async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    await this.executeBatch();
  }

  // Get current pending updates count
  getPendingCount() {
    return this.pendingUpdates.size;
  }

  // Clear all pending updates (useful for cleanup)
  clear() {
    this.pendingUpdates.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Create singleton instance
const batchManager = new FirebaseBatchManager();

// Helper functions for common batch operations
export const batchHelpers = {
  // Batch update user currency
  updateUserCurrency: (userId, amount) => {
    batchManager.queueUserUpdate(userId, { currency: amount });
  },

  // Batch update user health
  updateUserHealth: (userId, health) => {
    batchManager.queueUserUpdate(userId, { health });
  },

  // Batch update user points
  updateUserPoints: (userId, points) => {
    batchManager.queueUserUpdate(userId, { points });
  },

  // Batch update user inventory
  updateUserInventory: (userId, inventory) => {
    batchManager.queueUserUpdate(userId, { inventory });
  },

  // Batch update multiple user fields at once
  updateUser: (userId, updates) => {
    batchManager.queueUserUpdate(userId, updates);
  },

  // Force flush all pending updates
  flush: () => batchManager.flush(),

  // Get pending operations count
  getPendingCount: () => batchManager.getPendingCount(),

  // Clear all pending operations
  clear: () => batchManager.clear(),
};

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  batchManager.flush();
});

export default batchManager;
