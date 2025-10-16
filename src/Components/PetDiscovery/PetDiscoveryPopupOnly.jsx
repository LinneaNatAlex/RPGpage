import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { usePetDiscovery } from '../../hooks/usePetDiscovery';
import PetDiscoveryPopup from './PetDiscoveryPopup';
import styles from './PetDiscoveryPanel.module.css';

const PetDiscoveryPopupOnly = () => {
  const { user } = useAuth();
  const { 
    pendingDiscoveries, 
    hasActivePet, 
    loading, 
    acceptDiscovery, 
    declineDiscovery,
    currentPet
  } = usePetDiscovery();
  
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
      setShowPopup(false);
      setCurrentDiscovery(null);
    }
  };

  const handleDecline = async () => {
    if (!currentDiscovery) return;
    
    const success = await declineDiscovery(0); // Always decline the first one
    if (success) {
      setShowPopup(false);
      setCurrentDiscovery(null);
    }
  };

  // Only show popup, no panel
  return (
    <>
      {/* Popup for discoveries - this is the only component */}
      {showPopup && currentDiscovery && (
        <PetDiscoveryPopup
          discovery={currentDiscovery}
          onAccept={handleAccept}
          onDecline={handleDecline}
          loading={loading}
          petName={currentPet?.customName || currentPet?.name || 'Your pet'}
        />
      )}
    </>
  );
};

export default PetDiscoveryPopupOnly;
