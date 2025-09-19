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

// Function to award nits for every 100-word milestone (starting at 300 words)
// Reward system: 300 words = 50 nits, 400 words = 100 nits, 500 words = 150 nits, etc.
export const checkWordCountReward = async (userId, wordCount, previousWordCount = 0) => {
  if (!userId || wordCount < 300) return { awarded: false, nits: 0 };
  
  // Calculate how many 100-word milestones have been reached (starting from 300)
  const currentMilestones = Math.floor((wordCount - 300) / 100) + 1; // +1 for the initial 300-word reward
  const previousMilestones = Math.floor((previousWordCount - 300) / 100) + 1;
  const newMilestones = currentMilestones - previousMilestones;
  
  if (newMilestones <= 0) return { awarded: false, nits: 0 };
  
  // Award 50 nits for every 100 words (starting at 300 words)
  const nitsToAward = newMilestones * 50;
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      currency: increment(nitsToAward)
    });
    
    return { awarded: true, nits: nitsToAward };
  } catch (error) {
    console.error('Error awarding nits:', error);
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
    console.error('Error getting user word count:', error);
    return 0;
  }
};

// Function to update user's total word count in database
export const updateUserWordCount = async (userId, additionalWords) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentWordCount = userDoc.data().totalWordCount || 0;
      const newWordCount = currentWordCount + additionalWords;
      
      await updateDoc(userRef, {
        totalWordCount: newWordCount
      });
      
      return newWordCount;
    }
    return 0;
  } catch (error) {
    console.error('Error updating user word count:', error);
    return 0;
  }
};
