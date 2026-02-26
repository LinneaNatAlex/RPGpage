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
      }
    };

    // Ikke skriv ved mount/reload – vent til første intervall (sparer writes ved reload)
    const interval = setInterval(updateLocation, 30000);
    const firstDelay = setTimeout(updateLocation, 5000); // Første oppdatering etter 5 s

    return () => {
      clearInterval(interval);
      clearTimeout(firstDelay);
    };
  }, [user]);
};

export default useLocationTracker;
