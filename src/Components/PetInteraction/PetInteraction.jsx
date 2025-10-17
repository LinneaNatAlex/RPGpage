import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import styles from './PetInteraction.module.css';

const PetInteraction = ({ userData, onMoodUpdate }) => {
  const { user } = useAuth();
  const [isInteracting, setIsInteracting] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(null);
  const [petMood, setPetMood] = useState(50); // 0-100 scale
  const [showAnimation, setShowAnimation] = useState(false);

  console.log('PetInteraction - userData:', userData);
  console.log('PetInteraction - currentPet:', userData?.currentPet);

  useEffect(() => {
    if (userData?.currentPet) {
      setPetMood(userData.currentPet.mood || 50);
      setLastInteraction(userData.currentPet.lastInteraction);
    }
  }, [userData]);

  const getMoodText = (mood) => {
    if (mood >= 80) return 'Very Happy';
    if (mood >= 60) return 'Happy';
    if (mood >= 40) return 'Neutral';
    if (mood >= 20) return 'Sad';
    return 'Very Sad';
  };

  const canInteract = () => {
    if (!lastInteraction) return true;
    const now = new Date();
    const lastTime = lastInteraction.toDate ? lastInteraction.toDate() : new Date(lastInteraction);
    const timeDiff = now - lastTime;
    return timeDiff > 5 * 60 * 1000; // 5 minutes cooldown
  };

  const handleInteraction = async (type, moodChange) => {
    console.log('handleInteraction called:', { type, moodChange, user: !!user, currentPet: !!userData?.currentPet, isInteracting, canInteract: canInteract() });
    
    if (!user || !userData?.currentPet || isInteracting || !canInteract()) {
      console.log('Interaction blocked:', { user: !!user, currentPet: !!userData?.currentPet, isInteracting, canInteract: canInteract() });
      return;
    }

    console.log('Starting interaction...');
    setIsInteracting(true);
    setShowAnimation(true);

    try {
      const newMood = Math.max(0, Math.min(100, petMood + moodChange));
      const now = serverTimestamp();

      // Update pet mood in user's document
      const userRef = doc(db, 'users', userData.uid || user.uid);
      await updateDoc(userRef, {
        'currentPet.mood': newMood,
        'currentPet.lastInteraction': now,
        'currentPet.lastInteractionBy': user.uid,
        'currentPet.lastInteractionType': type
      });

      // Add interaction to pet's history
      const interactionData = {
        type,
        moodChange,
        newMood,
        timestamp: now,
        interactedBy: user.uid,
        interactedByName: user.displayName || 'Anonymous'
      };

      // Store in pet interactions collection
      const interactionsRef = doc(db, 'users', userData.uid, 'petInteractions', Date.now().toString());
      await updateDoc(interactionsRef, interactionData);

      setPetMood(newMood);
      setLastInteraction(now);
      
      if (onMoodUpdate) {
        onMoodUpdate(newMood);
      }

      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowAnimation(false);
        setIsInteracting(false);
      }, 2000);

    } catch (error) {
      console.error('Error updating pet mood:', error);
      alert('Error updating pet mood: ' + error.message);
      setIsInteracting(false);
      setShowAnimation(false);
    }
  };

  const handlePet = () => {
    handleInteraction('pet', 5);
  };

  const handlePlay = () => {
    handleInteraction('play', 10);
  };

  // Removed feed functionality as requested

  if (!userData?.currentPet) {
    return (
      <div className={styles.noPet}>
        <p>No active pet to interact with</p>
        <p>Debug: userData = {JSON.stringify(userData)}</p>
      </div>
    );
  }

  return (
    <div className={styles.petInteraction}>
      <div className={styles.petInfo}>
        <h3>{userData.currentPet.name}</h3>
        <div className={styles.moodDisplay}>
          <span className={styles.moodText}>{getMoodText(petMood)}</span>
          <span className={styles.moodValue}>({petMood}/100)</span>
        </div>
      </div>

      <div className={styles.interactionButtons}>
        <button
          className={`${styles.interactionBtn} ${styles.petBtn}`}
          onClick={handlePet}
          disabled={isInteracting || !canInteract()}
          title="Pet the animal (+5 mood)"
        >
          Pet
        </button>
        
        <button
          className={`${styles.interactionBtn} ${styles.playBtn}`}
          onClick={handlePlay}
          disabled={isInteracting || !canInteract()}
          title="Play with the animal (+10 mood)"
        >
          Play
        </button>
      </div>

      {!canInteract() && lastInteraction && (
        <p className={styles.cooldownText}>
          Cooldown: {Math.ceil((5 * 60 * 1000 - (new Date() - (lastInteraction.toDate ? lastInteraction.toDate() : new Date(lastInteraction)))) / 1000)}s
        </p>
      )}

      {showAnimation && (
        <div className={styles.animation}>
          <div className={styles.heartAnimation}>💖</div>
          <p>Mood increased!</p>
        </div>
      )}
    </div>
  );
};

export default PetInteraction;
