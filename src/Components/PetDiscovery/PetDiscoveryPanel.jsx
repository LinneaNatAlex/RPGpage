import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { usePetDiscovery } from '../../hooks/usePetDiscovery';
import PetDiscoveryNotification from './PetDiscoveryNotification';
import PetDiscoveryPopup from './PetDiscoveryPopup';
import styles from './PetDiscoveryPanel.module.css';

const PetDiscoveryPanel = () => {
  const { user } = useAuth();
  const { 
    pendingDiscoveries, 
    hasActivePet, 
    loading, 
    acceptDiscovery, 
    declineDiscovery,
    currentPet
  } = usePetDiscovery();
  
  const [showPanel, setShowPanel] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentDiscovery, setCurrentDiscovery] = useState(null);

  // Auto-show popup when there are new discoveries
  useEffect(() => {
    if (pendingDiscoveries.length > 0 && !showPopup) {
      // Show popup for the first pending discovery
      const firstDiscovery = pendingDiscoveries[0];
      setCurrentDiscovery(firstDiscovery);
      setShowPopup(true);
    } else if (pendingDiscoveries.length === 0 && showPopup) {
      // Hide popup if no more pending discoveries
      setShowPopup(false);
      setCurrentDiscovery(null);
    }
  }, [pendingDiscoveries.length, showPopup]);

  const handleAccept = async () => {
    if (!currentDiscovery) return;
    
    const success = await acceptDiscovery(0); // Always accept the first one
    if (success) {
      console.log('Discovery accepted!');
      setShowPopup(false);
      setCurrentDiscovery(null);
    }
  };

  const handleDecline = async () => {
    if (!currentDiscovery) return;
    
    const success = await declineDiscovery(0); // Always decline the first one
    if (success) {
      console.log('Discovery declined!');
      setShowPopup(false);
      setCurrentDiscovery(null);
    }
  };

  if (!hasActivePet) {
    return (
      <div className={styles.noPetMessage}>
        <div className={styles.noPetIcon}>🐾</div>
        <h3>No Active Pet</h3>
        <p>You need an active pet to discover items around the castle!</p>
        <p>Visit the shop to get a pet companion.</p>
      </div>
    );
  }


  return (
    <>
      {/* Popup for discoveries - this is the main component now */}
      {showPopup && currentDiscovery && (
        <PetDiscoveryPopup
          discovery={currentDiscovery}
          onAccept={handleAccept}
          onDecline={handleDecline}
          loading={loading}
          petName={currentPet?.customName || currentPet?.name || 'Your pet'}
        />
      )}
      
      {/* Pet Discovery Panel - visible to all users with pets */}
      {hasActivePet && (
        <div className={styles.petDiscoveryPanel}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              <span className={styles.petIcon}>🐾</span>
              Pet Discoveries
            </h2>
            <button 
              className={styles.toggleBtn}
              onClick={() => setShowPanel(!showPanel)}
            >
              {showPanel ? 'Hide' : 'Show'} ({pendingDiscoveries.length})
            </button>
          </div>

          {showPanel && (
            <div className={styles.content}>
              {pendingDiscoveries.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h3>No Discoveries Yet</h3>
                  <p>Your pet is exploring the castle...</p>
                  <p>Check back later for new discoveries!</p>
                </div>
              ) : (
                <div className={styles.discoveriesList}>
                  {pendingDiscoveries.map((discovery, index) => (
                    <div key={`${discovery.timestamp}-${index}`} className={styles.discoveryItem}>
                      <div className={styles.discoveryInfo}>
                        <div className={styles.petName}>{discovery.petName}</div>
                        <div className={styles.itemName}>Found: {discovery.item.name}</div>
                        <div className={styles.itemPrice}>{discovery.item.price} Nits</div>
                      </div>
                      <div className={styles.discoveryActions}>
                        <button 
                          className={styles.acceptBtn}
                          onClick={() => handleAccept(index)}
                          disabled={loading}
                        >
                          Accept
                        </button>
                        <button 
                          className={styles.declineBtn}
                          onClick={() => handleDecline(index)}
                          disabled={loading}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PetDiscoveryPanel;
