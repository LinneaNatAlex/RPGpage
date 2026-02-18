import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { cacheHelpers } from "../utils/firebaseCache";

const defaultUserData = {
  currency: 1000,
  inventory: [],
  health: 100,
  points: 0,
  roles: [],
  leadForRole: null,
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
};

// User data via onSnapshot – live updates (health/inventory/currency update without reload)
const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(defaultUserData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserData(defaultUserData);
      setLoading(false);
      return;
    }

    const applyData = (data) => {
      setUserData({
        currency: data.currency ?? 1000,
        inventory: data.inventory ?? [],
        health: data.health ?? 100,
        points: data.points ?? 0,
        roles: data.roles ?? [],
        leadForRole: data.leadForRole || null,
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
        surveillanceUntil: data.surveillanceUntil || null,
        luckyUntil: data.luckyUntil || null,
        wisdomUntil: data.wisdomUntil || null,
        charmUntil: data.charmUntil || null,
        mysteryUntil: data.mysteryUntil || null,
        infirmaryEnd: data.infirmaryEnd || null,
        detentionUntil: data.detentionUntil || null,
        invisibleUntil: data.invisibleUntil || null,
        lastHealthUpdate: data.lastHealthUpdate || null,
        currentPet: data.currentPet || null,
        craftedPotions: data.craftedPotions || [],
        lastSeenNewsAt: data.lastSeenNewsAt ?? null,
      });
    };

    // Optional: show cached data immediately for faster first paint
    const cached = cacheHelpers.getUserData(user.uid);
    if (cached) {
      applyData(cached);
      setLoading(false);
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (userDoc) => {
        if (!userDoc.exists()) return;
        const data = userDoc.data();
        cacheHelpers.setUserData(user.uid, data);

        let processedData = { ...data };
        const now = Date.now();
        if (data.infirmaryEnd && data.infirmaryEnd <= now) {
          processedData = {
            ...data,
            health: 100,
            infirmaryEnd: null,
            lastHealthUpdate: now,
          };
          import("../firebaseConfig").then(({ db: dbRef }) => {
            import("firebase/firestore").then(({ doc: docFn, updateDoc }) => {
              const ref = docFn(dbRef, "users", user.uid);
              updateDoc(ref, {
                health: 100,
                infirmaryEnd: null,
                lastHealthUpdate: now,
              }).catch(() => {});
            });
          });
        }
        applyData(processedData);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  return { userData, loading };
};

export default useUserData;
