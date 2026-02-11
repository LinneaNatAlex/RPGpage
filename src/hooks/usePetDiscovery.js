import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import { petDiscovery } from '../utils/petDiscovery';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Pet discovery: getDoc once (no snapshot) – refresh page to see updates
export const usePetDiscovery = () => {
  const { user } = useAuth();
  const [pendingDiscoveries, setPendingDiscoveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasActivePet, setHasActivePet] = useState(false);

  const fetchPetState = useCallback(async () => {
    if (!user) {
      setPendingDiscoveries([]);
      setHasActivePet(false);
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPendingDiscoveries(data.pendingPetDiscoveries || []);
        setHasActivePet(!!data.currentPet);
      } else {
        setPendingDiscoveries([]);
        setHasActivePet(false);
      }
    } catch {
      setPendingDiscoveries([]);
      setHasActivePet(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPetState();
  }, [fetchPetState]);

  const acceptDiscovery = async (discoveryIndex) => {
    if (!user) return false;
    setLoading(true);
    try {
      const success = await petDiscovery.acceptDiscovery(user.uid, discoveryIndex);
      if (success) await fetchPetState();
      return success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const declineDiscovery = async (discoveryIndex) => {
    if (!user) return false;
    setLoading(true);
    try {
      const success = await petDiscovery.declineDiscovery(user.uid, discoveryIndex);
      if (success) await fetchPetState();
      return success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const triggerDiscovery = async () => {
    if (!user || !hasActivePet) return null;
    setLoading(true);
    try {
      const discovery = await petDiscovery.triggerDiscovery(user.uid, 'Test Pet');
      if (discovery) await fetchPetState();
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
    refetchPetState: fetchPetState,
    currentPet: null,
  };
};
