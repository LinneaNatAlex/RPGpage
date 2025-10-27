import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Function to count words in text (strips HTML tags)
export const countWords = (text) => {
  if (!text) return 0;
  const cleanText = text
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  if (!cleanText) return 0;
  return cleanText.split(' ').filter(word => word.length > 0).length;
};

// Function to award nits for every 100-word milestone (starting at 100 words)
// Reward system: 100 words = 25 nits, 200 words = 50 nits, 300 words = 75 nits, etc.
export const checkWordCountReward = async (userId, wordCount, previousWordCount = 0) => {
  if (!userId || wordCount < 100) return { awarded: false, nits: 0 };
  
  // Calculate how many 100-word milestones have been reached (starting from 100)
  const currentMilestones = Math.floor((wordCount - 100) / 100) + 1; // +1 for the initial 100-word reward
  const previousMilestones = Math.floor((previousWordCount - 100) / 100) + 1;
  const newMilestones = currentMilestones - previousMilestones;
  
  if (newMilestones <= 0) return { awarded: false, nits: 0 };
  
  // Award 25 nits for every 100 words (starting at 100 words)
  const nitsToAward = newMilestones * 25;
  
  try {
    // Only update currency if we have a significant reward
    if (nitsToAward >= 25) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currency: increment(nitsToAward)
      });
      
      return { awarded: true, nits: nitsToAward };
    }
    
    return { awarded: false, nits: 0 };
  } catch (error) {
    return { awarded: false, nits: 0, error: error.message };
  }
};

// Function to get user's total word count from database
export const getUserWordCount = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().totalWordCount || 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// Local cache for word counts to reduce Firebase reads
const wordCountCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to update user's total word count in database (optimized)
export const updateUserWordCount = async (userId, additionalWords) => {
  try {
    const cacheKey = `wordCount_${userId}`;
    const cached = wordCountCache.get(cacheKey);
    const now = Date.now();
    
    let currentWordCount = 0;
    
    // Use cache if available and not expired
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      currentWordCount = cached.wordCount;
    } else {
      // Only read from Firebase if cache is expired or missing
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        currentWordCount = userDoc.data().totalWordCount || 0;
        // Update cache
        wordCountCache.set(cacheKey, {
          wordCount: currentWordCount,
          timestamp: now
        });
      }
    }
    
    const newWordCount = currentWordCount + additionalWords;
    
    // Only write to Firebase if we've accumulated significant words (batch updates)
    const shouldUpdate = additionalWords >= 10 || newWordCount % 50 === 0;
    
    if (shouldUpdate) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalWordCount: newWordCount
      });
      
      // Update cache
      wordCountCache.set(cacheKey, {
        wordCount: newWordCount,
        timestamp: now
      });
    }
    
    return newWordCount;
  } catch (error) {
    return 0;
  }
};
