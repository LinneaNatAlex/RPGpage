import React from 'react';
import styles from './PetFoundItemModal.module.css';

const PetFoundItemModal = ({ 
  isOpen, 
  onAccept, 
  onDecline, 
  foundItem, 
  petName, 
  petType 
}) => {
  if (!isOpen) return null;

  const handleAccept = () => {
    onAccept(foundItem);
  };

  const handleDecline = () => {
    onDecline();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>🐾 {petName} Found Something!</h2>
          <div className={styles.petEmoji}>
            {petType === 'cat' && '🐱'}
            {petType === 'dog' && '🐶'}
            {petType === 'owl' && '🦉'}
            {petType === 'snake' && '🐍'}
            {petType === 'toad' && '🐸'}
            {petType === 'rat' && '🐭'}
            {!['cat', 'dog', 'owl', 'snake', 'toad', 'rat'].includes(petType) && '🐾'}
          </div>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.storyText}>
            <p>Your {petType} <strong>{petName}</strong> was exploring the castle grounds and discovered something interesting!</p>
          </div>

          <div className={styles.foundItemDisplay}>
            {foundItem?.image && (
              <img 
                src={foundItem.image} 
                alt={foundItem.name}
                className={styles.itemImage}
              />
            )}
            <div className={styles.itemInfo}>
              <h3>{foundItem?.name}</h3>
              <p className={styles.itemDescription}>{foundItem?.description}</p>
              <p className={styles.itemValue}>Value: {foundItem?.price?.toLocaleString()} Nits</p>
            </div>
          </div>

          <div className={styles.questionText}>
            <p>Would you like to accept this item from {petName}?</p>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button 
            className={styles.acceptButton}
            onClick={handleAccept}
          >
            ✅ Accept Gift
          </button>
          <button 
            className={styles.declineButton}
            onClick={handleDecline}
          >
            ❌ Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetFoundItemModal;