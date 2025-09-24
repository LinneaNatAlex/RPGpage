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
    luckyUntil: null,
    wisdomUntil: null,
    surveillanceUntil: null,
    charmUntil: null,
    mysteryUntil: null,
    infirmaryEnd: null,
    detentionUntil: null,
    invisibleUntil: null,
    lastHealthUpdate: null
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
        slowMotionUntil: null,
        luckyUntil: null,
        wisdomUntil: null,
        surveillanceUntil: null,
        charmUntil: null,
        mysteryUntil: null,
        infirmaryEnd: null,
        detentionUntil: null,
        invisibleUntil: null,
        lastHealthUpdate: null
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

            // Update all user data at once
            setUserData({
              currency: data.currency ?? 1000,
              inventory: data.inventory ?? [],
              health: data.health ?? 100,
              points: data.points ?? 0,
              roles: data.roles ?? [],
              profileImageUrl: data.profileImageUrl || null,
              inLoveUntil: data.inLoveUntil || null,
              inLoveWith: data.inLoveWith || null,
              hairColorUntil: data.hairColorUntil || null,
              rainbowUntil: data.rainbowUntil || null,
              glowUntil: data.glowUntil || null,
              sparkleUntil: data.sparkleUntil || null,
              translationUntil: data.translationUntil || null,
              echoUntil: data.echoUntil || null,
              whisperUntil: data.whisperUntil || null,
              shoutUntil: data.shoutUntil || null,
              darkModeUntil: data.darkModeUntil || null,
              retroUntil: data.retroUntil || null,
              mirrorUntil: data.mirrorUntil || null,
              speedUntil: data.speedUntil || null,
              slowMotionUntil: data.slowMotionUntil || null,
              luckyUntil: data.luckyUntil || null,
              wisdomUntil: data.wisdomUntil || null,
              surveillanceUntil: data.surveillanceUntil || null,
              charmUntil: data.charmUntil || null,
              mysteryUntil: data.mysteryUntil || null,
              infirmaryEnd: data.infirmaryEnd || null,
              detentionUntil: data.detentionUntil || null,
              invisibleUntil: data.invisibleUntil || null,
              lastHealthUpdate: data.lastHealthUpdate || null
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to user data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { userData, loading };
};

export default useUserData;
