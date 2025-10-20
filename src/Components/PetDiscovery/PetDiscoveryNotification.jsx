import React from 'react';
import styles from './PetDiscoveryNotification.module.css';

const PetDiscoveryNotification = ({ 
  discovery, 
  onAccept, 
  onDecline, 
  loading 
}) => {
  const { petName, item, timestamp } = discovery;
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.notification}>
      <div className={styles.header}>
        <div className={styles.petIcon}>🐾</div>
        <div className={styles.petInfo}>
          <h3 className={styles.petName}>{petName}</h3>
          <span className={styles.timestamp}>{formatTime(timestamp)}</span>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.message}>
          <strong>{petName}</strong> has found something interesting!
        </div>
        
        <div className={styles.itemInfo}>
          <div className={styles.itemImage}>
            <img 
              src={item.image || '/icons/magic-school.svg'} 
              alt={item.name}
              onError={(e) => {
                e.target.src = '/icons/magic-school.svg';
              }}
            />
          </div>
          <div className={styles.itemDetails}>
            <h4 className={styles.itemName}>{item.name}</h4>
            <p className={styles.itemDescription}>{item.description}</p>
            <div className={styles.itemPrice}>
              <span className={styles.priceLabel}>Shop Price:</span>
              <span className={styles.priceValue}>{item.price} Nits</span>
            </div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.acceptBtn}
            onClick={() => onAccept()}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Accept'}
          </button>
          <button 
            className={styles.declineBtn}
            onClick={() => onDecline()}
            disabled={loading}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetDiscoveryNotification;
