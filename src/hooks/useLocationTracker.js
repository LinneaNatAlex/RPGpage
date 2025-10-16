import { useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const useLocationTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateLocation = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          currentLocation: window.location.pathname,
          lastSeen: Date.now()
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    // Update location on mount and route changes
    updateLocation();

    // Update location every 30 seconds
    const interval = setInterval(updateLocation, 30000);

    return () => clearInterval(interval);
  }, [user]);
};

export default useLocationTracker;
