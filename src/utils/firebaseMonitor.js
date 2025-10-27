// Firebase usage monitor to track quota consumption
// This monitor helps identify quota usage patterns and optimize accordingly

class FirebaseUsageMonitor {
  constructor() {
    this.reads = 0;
    this.writes = 0;
    this.deletes = 0;
    this.listeners = new Set();
    this.operationLog = [];
    this.startTime = Date.now();
    this.quotaLimits = {
      reads: 50000, // Daily read limit
      writes: 20000, // Daily write limit
      deletes: 20000, // Daily delete limit
    };
  }

  // Track read operations
  trackRead(source, count = 1) {
    this.reads += count;
    this.logOperation("READ", source, count);
    this.checkQuotaWarnings();
  }

  // Track write operations
  trackWrite(source, count = 1) {
    this.writes += count;
    this.logOperation("WRITE", source, count);
    this.checkQuotaWarnings();
  }

  // Track delete operations
  trackDelete(source, count = 1) {
    this.deletes += count;
    this.logOperation("DELETE", source, count);
    this.checkQuotaWarnings();
  }

  // Track real-time listeners
  trackListener(source, action = "ADD") {
    if (action === "ADD") {
      this.listeners.add(source);
    } else if (action === "REMOVE") {
      this.listeners.delete(source);
    }
  }

  // Log operation details
  logOperation(type, source, count) {
    const operation = {
      type,
      source,
      count,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString(),
    };

    this.operationLog.push(operation);

    // Keep only last 1000 operations to prevent memory issues
    if (this.operationLog.length > 1000) {
      this.operationLog.shift();
    }

    if (import.meta.env.DEV) {
    }
  }

  // Check for quota warnings
  checkQuotaWarnings() {
    const readPercent = (this.reads / this.quotaLimits.reads) * 100;
    const writePercent = (this.writes / this.quotaLimits.writes) * 100;
    const deletePercent = (this.deletes / this.quotaLimits.deletes) * 100;

    if (readPercent > 80) {
        `⚠️ Firebase reads at ${readPercent.toFixed(1)}% of daily quota`
      );
    }
    if (writePercent > 80) {
        `⚠️ Firebase writes at ${writePercent.toFixed(1)}% of daily quota`
      );
    }
    if (deletePercent > 80) {
        `⚠️ Firebase deletes at ${deletePercent.toFixed(1)}% of daily quota`
      );
    }

    // Critical warnings
    if (readPercent > 95 || writePercent > 95 || deletePercent > 95) {
"🚨 CRITICAL: Firebase quota nearly exceeded!");
    }
  }

  // Get usage statistics
  getStats() {
    const uptime = Date.now() - this.startTime;
    const hours = uptime / (1000 * 60 * 60);

    return {
      reads: this.reads,
      writes: this.writes,
      deletes: this.deletes,
      activeListeners: this.listeners.size,
      readsPerHour: Math.round(this.reads / hours),
      writesPerHour: Math.round(this.writes / hours),
      quotaUsage: {
        reads: `${((this.reads / this.quotaLimits.reads) * 100).toFixed(2)}%`,
        writes: `${((this.writes / this.quotaLimits.writes) * 100).toFixed(
          2
        )}%`,
        deletes: `${((this.deletes / this.quotaLimits.deletes) * 100).toFixed(
          2
        )}%`,
      },
      uptime: Math.round(hours * 100) / 100,
      operationCount: this.operationLog.length,
    };
  }

  // Get top usage sources
  getTopSources(limit = 10) {
    const sourceStats = {};

    this.operationLog.forEach((op) => {
      if (!sourceStats[op.source]) {
        sourceStats[op.source] = { reads: 0, writes: 0, deletes: 0, total: 0 };
      }
      sourceStats[op.source][op.type.toLowerCase() + "s"] += op.count;
      sourceStats[op.source].total += op.count;
    });

    return Object.entries(sourceStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, limit)
      .map(([source, stats]) => ({ source, ...stats }));
  }

  // Reset counters (useful for daily reset)
  reset() {
    this.reads = 0;
    this.writes = 0;
    this.deletes = 0;
    this.operationLog = [];
    this.startTime = Date.now();
"📊 Firebase usage monitor reset");
  }

  // Display usage report
  displayReport() {
    const stats = this.getStats();
    const topSources = this.getTopSources(5);

    console.group("📊 Firebase Usage Report");
"Current Usage:", stats);
"Top Sources:", topSources);
"Active Listeners:", Array.from(this.listeners));
    console.groupEnd();
  }
}

// Create singleton instance
const usageMonitor = new FirebaseUsageMonitor();

// Enhanced Firebase operations with monitoring
export const monitoredFirebase = {
  // Monitored read operations
  onSnapshot: (query, callback, source) => {
    usageMonitor.trackListener(source, "ADD");
    usageMonitor.trackRead(source, 1); // Initial read

    const unsubscribe = originalOnSnapshot(query, (snapshot) => {
      usageMonitor.trackRead(source, snapshot.docs.length);
      callback(snapshot);
    });

    return () => {
      usageMonitor.trackListener(source, "REMOVE");
      unsubscribe();
    };
  },

  getDocs: async (query, source) => {
    const snapshot = await originalGetDocs(query);
    usageMonitor.trackRead(source, snapshot.docs.length);
    return snapshot;
  },

  getDoc: async (docRef, source) => {
    const doc = await originalGetDoc(docRef);
    usageMonitor.trackRead(source, 1);
    return doc;
  },

  // Monitored write operations
  addDoc: async (collection, data, source) => {
    const result = await originalAddDoc(collection, data);
    usageMonitor.trackWrite(source, 1);
    return result;
  },

  updateDoc: async (docRef, data, source) => {
    const result = await originalUpdateDoc(docRef, data);
    usageMonitor.trackWrite(source, 1);
    return result;
  },

  setDoc: async (docRef, data, options, source) => {
    const result = await originalSetDoc(docRef, data, options);
    usageMonitor.trackWrite(source, 1);
    return result;
  },

  // Monitored delete operations
  deleteDoc: async (docRef, source) => {
    const result = await originalDeleteDoc(docRef);
    usageMonitor.trackDelete(source, 1);
    return result;
  },
};

// Import original Firebase functions
import {
  onSnapshot as originalOnSnapshot,
  getDocs as originalGetDocs,
  getDoc as originalGetDoc,
  addDoc as originalAddDoc,
  updateDoc as originalUpdateDoc,
  setDoc as originalSetDoc,
  deleteDoc as originalDeleteDoc,
} from "firebase/firestore";

// Auto-display report every 10 minutes in development
if (import.meta.env.DEV) {
  setInterval(() => {
    usageMonitor.displayReport();
  }, 10 * 60 * 1000);
}

// Export monitor and helpers
export const usageHelpers = {
  getStats: () => usageMonitor.getStats(),
  getTopSources: (limit) => usageMonitor.getTopSources(limit),
  displayReport: () => usageMonitor.displayReport(),
  reset: () => usageMonitor.reset(),
  trackRead: (source, count) => usageMonitor.trackRead(source, count),
  trackWrite: (source, count) => usageMonitor.trackWrite(source, count),
  trackDelete: (source, count) => usageMonitor.trackDelete(source, count),
};

export default usageMonitor;
