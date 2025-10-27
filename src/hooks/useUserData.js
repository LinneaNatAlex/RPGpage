import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { cacheHelpers } from "../utils/firebaseCache";

// Centralized user data hook to avoid multiple onSnapshot listeners
const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    currency: 1000,
    inventory: [],
    health: 100,
    points: 0,
    roles: [],
    profileImageUrl: null,
    inLoveUntil: null,
    inLoveWith: null,
    hairColorUntil: null,
    rainbowUntil: null,
    glowUntil: null,
    sparkleUntil: null,
    translationUntil: null,
    echoUntil: null,
    whisperUntil: null,
    shoutUntil: null,
    darkModeUntil: null,
    retroUntil: null,
    mirrorUntil: null,
    speedUntil: null,
    slowMotionUntil: null,
    surveillanceUntil: null,
    luckyUntil: null,
    wisdomUntil: null,
    charmUntil: null,
    mysteryUntil: null,
    infirmaryEnd: null,
    detentionUntil: null,
    invisibleUntil: null,
    lastHealthUpdate: null,
    currentPet: null,
    craftedPotions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserData({
        currency: 1000,
        inventory: [],
        health: 100,
        points: 0,
        roles: [],
        profileImageUrl: null,
        inLoveUntil: null,
        inLoveWith: null,
        hairColorUntil: null,
        rainbowUntil: null,
        glowUntil: null,
        sparkleUntil: null,
        translationUntil: null,
        echoUntil: null,
        whisperUntil: null,
        shoutUntil: null,
        darkModeUntil: null,
        retroUntil: null,
        mirrorUntil: null,
        speedUntil: null,
        luckyUntil: null,
        wisdomUntil: null,
        charmUntil: null,
        mysteryUntil: null,
        infirmaryEnd: null,
        detentionUntil: null,
        invisibleUntil: null,
        lastHealthUpdate: null,
        currentPet: null,
        craftedPotions: [],
      });
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (userDoc) => {
        try {
          if (userDoc.exists()) {
            const data = userDoc.data();

            // Cache the data
            cacheHelpers.setUserData(user.uid, data);

            // Check if infirmaryEnd has expired and handle recovery
            let processedData = { ...data };
            const now = Date.now();
            
            // If infirmaryEnd exists but has expired, recover the user
            if (data.infirmaryEnd && data.infirmaryEnd <= now) {
              processedData = {
                ...data,
                health: 100,
                infirmaryEnd: null,
                lastHealthUpdate: now
              };
              
              // Update Firebase with recovered state
              import('../firebaseConfig').then(({ db }) => {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                  const userRef = doc(db, "users", user.uid);
                  updateDoc(userRef, {
                    health: 100,
                    infirmaryEnd: null,
                    lastHealthUpdate: now
                  }).catch(error => {
                  });
                });
              });
            }

            // Update all user data at once
            setUserData({
              currency: processedData.currency ?? 1000,
              inventory: processedData.inventory ?? [],
              health: processedData.health ?? 100,
              points: processedData.points ?? 0,
              roles: processedData.roles ?? [],
              profileImageUrl: processedData.profileImageUrl || null,
              inLoveUntil: processedData.inLoveUntil || null,
              inLoveWith: processedData.inLoveWith || null,
              hairColorUntil: processedData.hairColorUntil || null,
              rainbowUntil: processedData.rainbowUntil || null,
              glowUntil: processedData.glowUntil || null,
              sparkleUntil: processedData.sparkleUntil || null,
              translationUntil: processedData.translationUntil || null,
              echoUntil: processedData.echoUntil || null,
              whisperUntil: processedData.whisperUntil || null,
              shoutUntil: processedData.shoutUntil || null,
              darkModeUntil: processedData.darkModeUntil || null,
              retroUntil: processedData.retroUntil || null,
              mirrorUntil: processedData.mirrorUntil || null,
              speedUntil: processedData.speedUntil || null,
              slowMotionUntil: processedData.slowMotionUntil || null,
              surveillanceUntil: processedData.surveillanceUntil || null,
              luckyUntil: processedData.luckyUntil || null,
              wisdomUntil: processedData.wisdomUntil || null,
              charmUntil: processedData.charmUntil || null,
              mysteryUntil: processedData.mysteryUntil || null,
              infirmaryEnd: processedData.infirmaryEnd || null,
              detentionUntil: processedData.detentionUntil || null,
              invisibleUntil: processedData.invisibleUntil || null,
              lastHealthUpdate: processedData.lastHealthUpdate || null,
              currentPet: processedData.currentPet || null,
              craftedPotions: processedData.craftedPotions || [],
            });
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { userData, loading };
};

export default useUserData;
