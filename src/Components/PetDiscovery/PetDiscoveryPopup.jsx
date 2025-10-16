import React, { useMemo } from 'react';
import styles from './PetDiscoveryPopup.module.css';

// Generate random discovery stories
const getDiscoveryStory = (petName, itemName) => {
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
  
  return stories[Math.floor(Math.random() * stories.length)];
};

// Get or generate a consistent story for a discovery
const getConsistentStory = (discovery, petName) => {
  // If story already exists, use it
  if (discovery.story) {
    return discovery.story;
  }
  
  // Generate a new story and store it
  const story = getDiscoveryStory(petName, discovery.item?.name || 'item');
  return story;
};

const PetDiscoveryPopup = React.memo(({ 
  discovery, 
  onAccept, 
  onDecline, 
  loading,
  petName 
}) => {
  
  // Handle different discovery object structures
  const item = discovery.item || discovery;
  const discoveryPetName = discovery.petName || petName || 'Your pet';
  const timestamp = discovery.timestamp || discovery.discoveryTime;
  
  // Memoize the story to prevent it from changing on re-renders
  const story = useMemo(() => {
    if (discovery.story) {
      return discovery.story;
    }
    return getDiscoveryStory(discoveryPetName, item.name);
  }, [discovery.story, discoveryPetName, item.name]);
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.petIcon}>🐾</div>
          <div className={styles.petInfo}>
            <h2 className={styles.petName}>{discoveryPetName}</h2>
            <span className={styles.timestamp}>{formatTime(timestamp)}</span>
          </div>
          <button 
            className={styles.closeBtn}
            onClick={onDecline}
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.story}>
            <p className={styles.discoveryStory}>
              {story}
            </p>
            <div className={styles.itemName}>
              Found: <strong>{item.name}</strong>
              {discovery.luckyEffect && (
                <div className={styles.luckyEffect}>
                  🍀 Lucky Potion Effect: Rare item found!
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.acceptBtn}
              onClick={onAccept}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Accept'}
            </button>
            <button 
              className={styles.declineBtn}
              onClick={onDecline}
              disabled={loading}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PetDiscoveryPopup;
