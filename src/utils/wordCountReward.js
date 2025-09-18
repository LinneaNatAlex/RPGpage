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

// Function to award nits for every 500-word milestone
export const checkWordCountReward = async (userId, wordCount, previousWordCount = 0) => {
  if (!userId || wordCount < 500) return { awarded: false, nits: 0 };
  
  // Calculate how many 500-word milestones have been reached
  const currentMilestones = Math.floor(wordCount / 500);
  const previousMilestones = Math.floor(previousWordCount / 500);
  const newMilestones = currentMilestones - previousMilestones;
  
  if (newMilestones <= 0) return { awarded: false, nits: 0 };
  
  const nitsToAward = newMilestones * 10;
  
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
