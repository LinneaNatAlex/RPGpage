import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { petDiscovery } from '../utils/petDiscovery';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const usePetDiscovery = () => {
  const { user } = useAuth();
  const [pendingDiscoveries, setPendingDiscoveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasActivePet, setHasActivePet] = useState(false);

  // Load pending discoveries and pet status with real-time updates
  useEffect(() => {
    if (!user) {
      setPendingDiscoveries([]);
      setHasActivePet(false);
      return;
    }

    // Use real-time listener for pending discoveries
    
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPendingDiscoveries(data.pendingPetDiscoveries || []);
        setHasActivePet(!!data.currentPet);
      } else {
        setPendingDiscoveries([]);
        setHasActivePet(false);
      }
    }, (error) => {
    });

    return () => unsubscribe();
  }, [user]);

  // Accept a discovery
  const acceptDiscovery = async (discoveryIndex) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const success = await petDiscovery.acceptDiscovery(user.uid, discoveryIndex);
      // No need to reload - real-time listener will update automatically
      return success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Decline a discovery
  const declineDiscovery = async (discoveryIndex) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const success = await petDiscovery.declineDiscovery(user.uid, discoveryIndex);
      // No need to reload - real-time listener will update automatically
      return success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Trigger a discovery (for testing or manual triggers)
  const triggerDiscovery = async () => {
    if (!user || !hasActivePet) return null;
    
    setLoading(true);
    try {
      const discovery = await petDiscovery.triggerDiscovery(user.uid, 'Test Pet');
      // No need to reload - real-time listener will update automatically
      return discovery;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingDiscoveries,
    hasActivePet,
    loading,
    acceptDiscovery,
    declineDiscovery,
    triggerDiscovery,
    currentPet: null // Will be populated from user data if needed
  };
};
