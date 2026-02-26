import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { cacheHelpers } from "../utils/firebaseCache";

const USER_DATA_POLL_MS = 3 * 60 * 1000; // 3 min – leser ikke ved hver lastActive-oppdatering

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
  detentionReason: null,
  invisibleUntil: null,
  lastHealthUpdate: null,
  craftedPotions: [],
  vipExpiresAt: null,
  followedTopics: [],
  ageVerified: false,
};

// User data via polling – ingen lesing ved lastActive/potion-oppdateringer, kun når vi henter
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
        detentionReason: data.detentionReason || null,
        invisibleUntil: data.invisibleUntil || null,
        lastHealthUpdate: data.lastHealthUpdate || null,
        craftedPotions: data.craftedPotions || [],
        lastSeenNewsAt: data.lastSeenNewsAt ?? null,
        vipExpiresAt: data.vipExpiresAt ?? null,
        followedTopics: Array.isArray(data.followedTopics) ? data.followedTopics : [],
        ageVerified: !!data.ageVerified,
      });
    };

    const cached = cacheHelpers.getUserData(user.uid);
    if (cached) {
      applyData(cached);
      setLoading(false);
    } else if (user.roles != null || user.inventory != null || user.currency != null) {
      // Auth har allerede merger doc inn i user – bruk det og spar 1 getDoc per reload
      applyData(user);
      setLoading(false);
    }

    const userRef = doc(db, "users", user.uid);

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(userRef);
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
          await updateDoc(userRef, {
            health: 100,
            infirmaryEnd: null,
            lastHealthUpdate: now,
          }).catch(() => {});
        }
        applyData(processedData);
      } catch (e) {
        if (cached) applyData(cached);
      } finally {
        setLoading(false);
      }
    };

    let interval = null;
    let firstDelayId = null;
    const runWhenVisible = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      // Forsink første hent 2s ved reload så vi ikke dobler getDoc rett etter auth
      firstDelayId = setTimeout(fetchUserData, 2000);
      interval = setInterval(fetchUserData, USER_DATA_POLL_MS);
    };
    runWhenVisible();
    const onVisibility = () => {
      if (firstDelayId) clearTimeout(firstDelayId);
      firstDelayId = null;
      if (interval) clearInterval(interval);
      interval = null;
      if (document.visibilityState === "visible") runWhenVisible();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (firstDelayId) clearTimeout(firstDelayId);
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const vipExpiresAt = userData?.vipExpiresAt;
  const vipExpiresAtMs =
    vipExpiresAt == null
      ? null
      : typeof vipExpiresAt === "number"
        ? vipExpiresAt
        : vipExpiresAt?.toMillis?.() ?? null;
  const isVip = vipExpiresAtMs != null && vipExpiresAtMs > Date.now();

  return { userData, loading, isVip };
};

export default useUserData;
