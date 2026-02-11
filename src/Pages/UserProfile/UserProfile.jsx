// import the necessary libraries and components
import { useState, useEffect, startTransition } from "react";
import useUsers from "../../hooks/useUser";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import styles from "./UserProfile.module.css";
import FriendsList from "../../Components/FriendsList/FriendsList";
import { useAuth } from "../../context/authContext";
import { getRaceColor, getRaceDisplayName } from "../../utils/raceColors";
import { addImageToItem } from "../../utils/itemImages";
import ErrorBoundary from "../../Components/ErrorBoundary/ErrorBoundary";
import { Suspense } from "react";

// state variables and hooks to manage user profile data
const UserProfile = () => {
  const { user } = useAuth();
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);
  const [userDocId, setUserDocId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showPetInteraction, setShowPetInteraction] = useState(false);
  const [petMood, setPetMood] = useState(userData?.currentPet?.mood || 50);
  const [isInteracting, setIsInteracting] = useState(false);
  const [lastPet, setLastPet] = useState(null);
  const [lastPlay, setLastPlay] = useState(null);
  const [petTimeLeft, setPetTimeLeft] = useState(0);
  const [playTimeLeft, setPlayTimeLeft] = useState(0);
  // Birthday state
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthdayMonth, setBirthdayMonth] = useState(
    userData?.birthdayMonth || 1,
  );
  const [birthdayDay, setBirthdayDay] = useState(userData?.birthdayDay || 1);
  const [birthdaySaved, setBirthdaySaved] = useState(
    !!userData?.birthdayMonth && !!userData?.birthdayDay,
  );

  // Calculate pet HP based on time since last fed (1 day = 100% to 0%)
  const calculatePetHP = (pet) => {
    if (!pet || !pet.lastFed) {
      // If no lastFed timestamp, assume pet was just acquired at full HP
      return 100;
    }

    const now = new Date().getTime();
    const lastFed = pet.lastFed.toMillis ? pet.lastFed.toMillis() : pet.lastFed;
    const timeSinceFed = now - lastFed;
    const maxStarvationTime = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

    // Pet loses HP gradually over 3 days (72 hours)
    const hpPercentage = Math.max(
      0,
      100 - (timeSinceFed / maxStarvationTime) * 100,
    );
    return Math.round(hpPercentage);
  };

  //  ----------------------------------useEffect----------------------------------
  useEffect(() => {
    // function to fetch user data based on rout parameter 'uid'
    const fetchUserData = async () => {
      try {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          const todayStr = new Date().toISOString().slice(0, 10);
          let dataToSet = data;
          if (
            data.currentPet &&
            (data.currentPet.lastResetDate || "") !== todayStr
          ) {
            const reset = {
              "currentPet.petCountToday": 0,
              "currentPet.playCountToday": 0,
              "currentPet.lastResetDate": todayStr,
            };
            await updateDoc(doc(db, "users", docSnap.id), reset).catch(
              () => {},
            );
            dataToSet = {
              ...data,
              currentPet: {
                ...data.currentPet,
                petCountToday: 0,
                playCountToday: 0,
                lastResetDate: todayStr,
              },
            };
          }
          startTransition(() => {
            setUserDocId(docSnap.id);
            setUserData(dataToSet);
            if (dataToSet.currentPet?.mood !== undefined)
              setPetMood(dataToSet.currentPet.mood);
            if (dataToSet.currentPet?.lastPet)
              setLastPet(dataToSet.currentPet.lastPet);
            if (dataToSet.currentPet?.lastPlay)
              setLastPlay(dataToSet.currentPet.lastPlay);
          });
        } else {
          startTransition(() => {
            setNotFound(true);
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        startTransition(() => {
          setNotFound(true);
        });
      }
    };
    if (uid) fetchUserData();
  }, [uid]);

  const handleProfileLike = async () => {
    if (!user || !userDocId || !userData || user.uid === userData.uid) return;
    const profileLikedBy = Array.isArray(userData.profileLikedBy)
      ? userData.profileLikedBy
      : [];
    const hasLiked = profileLikedBy.includes(user.uid);
    const userRef = doc(db, "users", userDocId);
    try {
      if (hasLiked) {
        await updateDoc(userRef, { profileLikedBy: arrayRemove(user.uid) });
        setUserData((prev) => ({
          ...prev,
          profileLikedBy: (prev.profileLikedBy || []).filter(
            (id) => id !== user.uid,
          ),
        }));
      } else {
        await updateDoc(userRef, { profileLikedBy: arrayUnion(user.uid) });
        setUserData((prev) => ({
          ...prev,
          profileLikedBy: [...(prev.profileLikedBy || []), user.uid],
        }));
        const likerName = user.displayName?.trim() || user.email || "Someone";
        await addDoc(collection(db, "notifications"), {
          to: userData.uid,
          type: "profile_like",
          from: user.uid,
          fromUid: user.uid,
          fromName: likerName,
          read: false,
          created: Date.now(),
        });
      }
    } catch (err) {}
  };

  const getTodayString = () => new Date().toISOString().slice(0, 10);
  const DAILY_PET_LIMIT = 3;
  const DAILY_PLAY_LIMIT = 3;

  const canPet = () => {
    if (!userData?.currentPet) return false;
    if (calculatePetHP(userData.currentPet) <= 0) return false;
    const today = getTodayString();
    const lastReset = userData.currentPet.lastResetDate || "";
    const petCountToday =
      lastReset === today ? (userData.currentPet.petCountToday ?? 0) : 0;
    return petCountToday < DAILY_PET_LIMIT;
  };

  const canPlay = () => {
    if (!userData?.currentPet) return false;
    if (calculatePetHP(userData.currentPet) <= 0) return false;
    const today = getTodayString();
    const lastReset = userData.currentPet.lastResetDate || "";
    const playCountToday =
      lastReset === today ? (userData.currentPet.playCountToday ?? 0) : 0;
    return playCountToday < DAILY_PLAY_LIMIT;
  };

  const getPetCountToday = () => {
    const today = getTodayString();
    const lastReset = userData?.currentPet?.lastResetDate || "";
    return lastReset === today ? (userData?.currentPet?.petCountToday ?? 0) : 0;
  };
  const getPlayCountToday = () => {
    const today = getTodayString();
    const lastReset = userData?.currentPet?.lastResetDate || "";
    return lastReset === today
      ? (userData?.currentPet?.playCountToday ?? 0)
      : 0;
  };

  useEffect(() => {
    const runDecay = () => {
      const now = new Date();
      if (userData?.currentPet?.lastInteraction) {
        const lastInteraction = userData.currentPet.lastInteraction.toDate
          ? userData.currentPet.lastInteraction.toDate()
          : new Date(userData.currentPet.lastInteraction);
        const timeSinceInteraction = now - lastInteraction;
        const decayInterval = 5 * 60 * 1000;
        const decayAmount = Math.floor(timeSinceInteraction / decayInterval);
        if (decayAmount > 0) {
          const newMood = Math.max(0, petMood - decayAmount);
          if (newMood !== petMood) {
            setPetMood(newMood);
            if (userDocId) {
              updateDoc(doc(db, "users", userDocId), {
                "currentPet.mood": newMood,
              }).catch(() => {});
            }
          }
        }
      }
    };
    runDecay();
    const interval = setInterval(runDecay, 60 * 1000);
    return () => clearInterval(interval);
  }, [userData, petMood, userDocId]);

  const handlePetInteraction = async (type, moodChange) => {
    if (!user || !userData?.currentPet || isInteracting) return;
    if (type === "pet" && !canPet()) return;
    if (type === "play" && !canPlay()) return;

    setIsInteracting(true);
    const today = getTodayString();
    const lastReset = userData.currentPet.lastResetDate || "";
    const currentPetCountToday =
      lastReset === today ? (userData.currentPet.petCountToday ?? 0) : 0;
    const currentPlayCountToday =
      lastReset === today ? (userData.currentPet.playCountToday ?? 0) : 0;

    try {
      const newMood = Math.min(100, petMood + moodChange);
      const now = serverTimestamp();
      const userRef = doc(db, "users", userDocId);
      const updateData = {
        "currentPet.mood": newMood,
        "currentPet.lastInteraction": now,
        "currentPet.lastInteractionBy": user.uid,
        "currentPet.lastInteractionType": type,
        "currentPet.lastResetDate": today,
        "currentPet.petCountToday":
          type === "pet" ? currentPetCountToday + 1 : currentPetCountToday,
        "currentPet.playCountToday":
          type === "play" ? currentPlayCountToday + 1 : currentPlayCountToday,
      };
      updateData[
        `currentPet.last${type.charAt(0).toUpperCase() + type.slice(1)}`
      ] = now;
      const currentPetCount = userData.currentPet.petCount || 0;
      const currentPlayCount = userData.currentPet.playCount || 0;
      if (type === "pet")
        updateData["currentPet.petCount"] = currentPetCount + 1;
      if (type === "play")
        updateData["currentPet.playCount"] = currentPlayCount + 1;

      await updateDoc(userRef, updateData);

      setPetMood(newMood);
      setUserData((prev) => ({
        ...prev,
        currentPet: {
          ...prev.currentPet,
          mood: newMood,
          lastResetDate: today,
          petCountToday:
            type === "pet" ? currentPetCountToday + 1 : currentPetCountToday,
          playCountToday:
            type === "play" ? currentPlayCountToday + 1 : currentPlayCountToday,
          petCount:
            type === "pet"
              ? currentPetCount + 1
              : prev.currentPet?.petCount || 0,
          playCount:
            type === "play"
              ? currentPlayCount + 1
              : prev.currentPet?.playCount || 0,
        },
      }));

      setTimeout(() => {
        setShowPetInteraction(false);
        setIsInteracting(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating pet mood:", error);
      alert("Error updating pet mood: " + error.message);
      setIsInteracting(false);
    }
  };

  if (notFound)
    return (
      <ErrorBoundary>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            padding: "2rem",
            background: "linear-gradient(135deg, #E8DDD4 0%, #F5EFE0 100%)",
            borderRadius: 0,
            border: "2px solid #7B6857",
            margin: "2rem auto",
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          <h2 style={{ color: "#7B6857", marginBottom: "1rem" }}>
            User not found
          </h2>
          <p style={{ color: "#2C2C2C", marginBottom: "1rem" }}>
            The user you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
              color: "#F5EFE0",
              border: "none",
              borderRadius: 0,
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            Go Back
          </button>
        </div>
      </ErrorBoundary>
    );

  if (!userData)
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
                padding: "2rem",
                background: "linear-gradient(135deg, #E8DDD4 0%, #F5EFE0 100%)",
                borderRadius: 0,
                border: "2px solid #7B6857",
                margin: "2rem auto",
                textAlign: "center",
                maxWidth: "500px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid #7B6857",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 20px",
                }}
              ></div>
              <h2 style={{ color: "#7B6857", marginBottom: "1rem" }}>
                Loading Profile...
              </h2>
              <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
            </div>
          }
        >
          <div>Loading...</div>
        </Suspense>
      </ErrorBoundary>
    );

  // Rolle-farge for navn
  let nameClass = styles.userName;
  if (userData.roles?.some((r) => r.toLowerCase() === "headmaster"))
    nameClass += ` ${styles.headmasterName}`;
  else if (userData.roles?.some((r) => r.toLowerCase() === "teacher"))
    nameClass += ` ${styles.teacherName}`;
  else if (userData.roles?.some((r) => r.toLowerCase() === "shadowpatrol"))
    nameClass += ` ${styles.shadowPatrolName}`;
  else if (userData.roles?.some((r) => r.toLowerCase() === "admin"))
    nameClass += ` ${styles.adminName}`;
  // ----------------------------------PROFILE CONTENT----------------------------------
  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        <div className={styles.imageContainer}>
          {/* image container */}
          {(() => {
            let roleClass = styles.profileImage;
            if (userData.roles?.some((r) => r.toLowerCase() === "headmaster"))
              roleClass += ` ${styles.headmasterAvatar}`;
            else if (userData.roles?.some((r) => r.toLowerCase() === "teacher"))
              roleClass += ` ${styles.teacherAvatar}`;
            else if (
              userData.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
            )
              roleClass += ` ${styles.shadowPatrolAvatar}`;
            else if (userData.roles?.some((r) => r.toLowerCase() === "admin"))
              roleClass += ` ${styles.adminAvatar}`;
            else if (
              userData.roles?.some((r) => r.toLowerCase() === "archivist")
            )
              roleClass += ` ${styles.archivistAvatar}`;
            // Love Potion effect: pink glow if inLoveUntil in future
            const inLove =
              userData.inLoveUntil && userData.inLoveUntil > Date.now();
            return (
              <>
                <img
                  src={userData?.profileImageUrl || "/icons/avatar.svg"}
                  alt="Image"
                  className={roleClass}
                  style={
                    inLove
                      ? {
                          boxShadow:
                            "0 0 16px 6px #ff69b4, 0 0 32px 12px #ffb6d5 inset",
                          borderRadius: "50%",
                        }
                      : {}
                  }
                />
                {inLove && userData.inLoveWith && (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#ff69b4",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    In love with {userData.inLoveWith}
                  </div>
                )}
                {/* Profile like under the image - only when viewing someone else's profile */}
                {user && userDocId && userData && user.uid !== userData.uid && (
                  <div className={styles.profileLikeRow}>
                    <button
                      type="button"
                      className={styles.profileLikeButton}
                      onClick={handleProfileLike}
                      title={
                        Array.isArray(userData.profileLikedBy) &&
                        userData.profileLikedBy.includes(user.uid)
                          ? "Unlike profile"
                          : "Like profile"
                      }
                      aria-label={
                        Array.isArray(userData.profileLikedBy) &&
                        userData.profileLikedBy.includes(user.uid)
                          ? "Unlike profile"
                          : "Like profile"
                      }
                    >
                      {Array.isArray(userData.profileLikedBy) &&
                      userData.profileLikedBy.includes(user.uid)
                        ? "❤️"
                        : "🤍"}
                    </button>
                    {Array.isArray(userData.profileLikedBy) &&
                      userData.profileLikedBy.length > 0 && (
                        <span className={styles.profileLikeCount}>
                          {userData.profileLikedBy.length}
                        </span>
                      )}
                  </div>
                )}
                {/* Own profile: show how many likes you've received */}
                {user && userData && user.uid === userData.uid && (
                  <div className={styles.profileLikesOverview}>
                    <span className={styles.profileLikesOverviewIcon}>❤️</span>
                    <span className={styles.profileLikesOverviewText}>
                      {Array.isArray(userData.profileLikedBy)
                        ? userData.profileLikedBy.length
                        : 0}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        {/* --------------------------------CHARACTER DETAILS-------------------------------- */}
        <div className={styles.characterDetailsContainer}>
          <div className={styles.charactinfo}>
            <h2
              style={{
                color: "#FFD700",
                fontSize: "2rem",
                fontWeight: 700,
                margin: "0 0 1.5rem 0",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                textAlign: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              Character Details
            </h2>
            <p
              style={{
                color: "#FFE55C",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Full Name:
              </strong>{" "}
              {(() => {
                let roleNameClass = nameClass;
                let nameColor = "#FFFFFF"; // Default color

                if (
                  userData.roles?.some((r) => r.toLowerCase() === "headmaster")
                )
                  roleNameClass += ` ${styles.headmasterName}`;
                else if (
                  userData.roles?.some((r) => r.toLowerCase() === "teacher")
                )
                  roleNameClass += ` ${styles.teacherName}`;
                else if (
                  userData.roles?.some(
                    (r) => r.toLowerCase() === "shadowpatrol",
                  )
                )
                  roleNameClass += ` ${styles.shadowPatrolName}`;
                else if (
                  userData.roles?.some((r) => r.toLowerCase() === "admin")
                )
                  roleNameClass += ` ${styles.adminName}`;
                else if (
                  userData.roles?.some((r) => r.toLowerCase() === "archivist")
                )
                  roleNameClass += ` ${styles.archivistName}`;
                else {
                  // Use race color for students without roles
                  nameColor = getRaceColor(userData?.race);
                }

                return (
                  <span
                    className={roleNameClass}
                    style={{
                      color: nameColor,
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {userData.displayName}
                  </span>
                );
              })()}
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Class:
              </strong>{" "}
              {userData.class}
            </p>
            {/* Bursdag kun i Character Details, med valgskjema hvis ikke satt */}
            {userData.birthdayMonth && userData.birthdayDay ? (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  margin: 0,
                }}
              >
                <span role="img" aria-label="birthday" style={{ fontSize: 18 }}>
                  🎂
                </span>
                <strong>Birthday:</strong>{" "}
                <span style={{ color: "#ffe084", fontWeight: 600 }}>
                  {
                    [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ][userData.birthdayMonth - 1]
                  }
                  , Day {userData.birthdayDay}
                </span>
              </p>
            ) : user?.uid === userData.uid ? (
              <div style={{ margin: "8px 0" }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // TODO: Save to Firestore her
                    startTransition(() => {
                      setBirthdaySaved(true);
                      setEditingBirthday(false);
                    });
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    role="img"
                    aria-label="birthday"
                    style={{ fontSize: 18 }}
                  >
                    🎂
                  </span>
                  <label style={{ fontSize: 13, marginRight: 6 }}>
                    Month:
                    <select
                      value={birthdayMonth}
                      onChange={(e) =>
                        startTransition(() =>
                          setBirthdayMonth(Number(e.target.value)),
                        )
                      }
                      style={{ marginLeft: 4 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: 13, marginRight: 6 }}>
                    Day:
                    <select
                      value={birthdayDay}
                      onChange={(e) =>
                        startTransition(() =>
                          setBirthdayDay(Number(e.target.value)),
                        )
                      }
                      style={{ marginLeft: 4 }}
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" style={{ fontSize: 12, marginLeft: 8 }}>
                    Save
                  </button>
                </form>
              </div>
            ) : (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  margin: 0,
                }}
              >
                <span role="img" aria-label="birthday" style={{ fontSize: 18 }}>
                  🎂
                </span>
                <strong>Birthday:</strong>
                <span
                  style={{
                    color: "#b0aac2",
                    fontStyle: "italic",
                    marginLeft: 6,
                  }}
                >
                  Not set
                </span>
              </p>
            )}
            {editingBirthday && user?.uid === userData.uid && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Save to Firestore here
                  startTransition(() => {
                    setBirthdaySaved(true);
                    setEditingBirthday(false);
                  });
                }}
                style={{ margin: "8px 0" }}
              >
                <label style={{ fontSize: 13, marginRight: 6 }}>
                  Month:
                  <select
                    value={birthdayMonth}
                    onChange={(e) =>
                      startTransition(() =>
                        setBirthdayMonth(Number(e.target.value)),
                      )
                    }
                    style={{ marginLeft: 4 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 13, marginRight: 6 }}>
                  Day:
                  <select
                    value={birthdayDay}
                    onChange={(e) =>
                      startTransition(() =>
                        setBirthdayDay(Number(e.target.value)),
                      )
                    }
                    style={{ marginLeft: 4 }}
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" style={{ fontSize: 12, marginLeft: 8 }}>
                  Save
                </button>
                <button
                  type="button"
                  style={{ fontSize: 12, marginLeft: 4 }}
                  onClick={() =>
                    startTransition(() => setEditingBirthday(false))
                  }
                >
                  Cancel
                </button>
              </form>
            )}
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Magical Race:
              </strong>{" "}
              {userData.race &&
              ["Witch", "witch", "witches", "Witches"].includes(userData.race)
                ? "Wizard"
                : userData.race}
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Balance:
              </strong>{" "}
              {userData.currency ?? 1000} Nits
            </p>
          </div>

          <div className={styles.charactinfo}>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Account Created:
              </strong>
              {userData.createdAt && userData.createdAt.toDate
                ? userData.createdAt.toDate().toLocaleDateString()
                : "N/A"}
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Last Login:
              </strong>
              {userData.lastLogin
                ? userData.lastLogin.toDate().toLocaleString()
                : "N/A"}
            </p>
            <p
              style={{
                color: "#FFFFFF",
                fontSize: "1.1rem",
                margin: "0.5rem 0",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong
                style={{
                  color: "#FFE4B5",
                  fontWeight: 700,
                  marginRight: "0.5rem",
                }}
              >
                Roles:
              </strong>{" "}
              {userData.roles?.join(", ")}
            </p>

            {/* Pet: paw button only – opens popup with full pet details */}
            {userData.currentPet && (
              <p
                style={{
                  color: "#FFFFFF",
                  fontSize: "1.1rem",
                  margin: "0.5rem 0",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                }}
              >
                <strong
                  style={{
                    color: "#FFE4B5",
                    fontWeight: 700,
                    marginRight: "0.5rem",
                  }}
                >
                  Pet:
                </strong>
                <button
                  type="button"
                  className={styles.petPawOnlyButton}
                  onClick={() => setShowPetInteraction(true)}
                  title="View pet"
                  aria-label="View pet"
                >
                  🐾
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      {/* -----------------------------PROFILE BIO----------------------------- */}
      {userData.profileText ? (
        <div className={styles.profileTextContainer}>
          <h2>Profile Text</h2>
          <iframe
            srcDoc={(() => {
              let raw = (userData.profileText || "")
                .replace("{{code}}", "")
                .replace("{{/code}}", "");
              raw = raw.replace(/(\s(?:src|href)\s*=\s*["'])http:\/\//gi, "$1https://");
              const isDark =
                typeof document !== "undefined" &&
                !!document.querySelector('[data-theme="dark"]');
              const bg = isDark ? "#1a1a1a" : "#e8ddd4";
              const fg = isDark ? "#e0e0e0" : "#2c2c2c";
              return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:1rem;color:${fg};box-sizing:border-box;background:${bg};}*{box-sizing:inherit;}</style>
</head>
<body style="background:${bg}">${raw}</body>
</html>`;
            })()}
            style={{
              width: "100%",
              height: "1000vh",
              border: "none",
              borderRadius: 0,
              background: "transparent",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            title="Profile Text"
          />
        </div>
      ) : (
        // IF USER HAS NO BIO
        <div>No profile bio available</div>
      )}

      {/* Pet Interaction Modal – popup with pet image, HP, and actions */}
      {showPetInteraction && userData?.currentPet && (
        <div className={styles.petInteractionModal}>
          <div className={styles.petInteractionModalContent}>
            <div className={styles.petInteractionHeader}>
              <h3>Pet</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowPetInteraction(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.petModalPetDisplay}>
              <img
                src={addImageToItem(userData.currentPet).image}
                alt={userData.currentPet.customName || userData.currentPet.name}
                className={styles.petModalImage}
              />
              <span className={styles.petModalName}>
                {userData.currentPet.customName || userData.currentPet.name}
              </span>
              <div className={styles.petModalHpRow}>
                <div className={styles.petModalHpBar}>
                  <div
                    className={styles.petModalHpFill}
                    style={{
                      width: `${calculatePetHP(userData.currentPet)}%`,
                    }}
                  />
                </div>
                <span className={styles.petModalHpText}>
                  {Math.round(calculatePetHP(userData.currentPet))}% HP
                </span>
              </div>
            </div>
            {userData?.currentPet &&
              calculatePetHP(userData.currentPet) <= 0 && (
                <div className={styles.cooldownText}>
                  Feed your pet to restore HP before petting or playing.
                </div>
              )}

            <div className={styles.petInteractionButtons}>
              <button
                className={styles.petInteractionBtn}
                onClick={() => handlePetInteraction("pet", 5)}
                disabled={isInteracting || !canPet()}
                title="Pet the animal (+5 mood). Max 3 per day."
              >
                {isInteracting ? "Petting..." : "Pet"}
              </button>
              <button
                className={styles.petInteractionBtn}
                onClick={() => handlePetInteraction("play", 10)}
                disabled={isInteracting || !canPlay()}
                title="Play with the animal (+10 mood). Max 3 per day."
              >
                {isInteracting ? "Playing..." : "Play"}
              </button>
            </div>

            <div className={styles.cooldownText}>
              Pet {getPetCountToday()}/{DAILY_PET_LIMIT} today · Play{" "}
              {getPlayCountToday()}/{DAILY_PLAY_LIMIT} today
            </div>

            <div className={styles.petMoodDisplay}>
              <span className={styles.moodLabel}>Pet Mood:</span>
              <span className={styles.moodValue}>{petMood}/100</span>
              <span className={styles.moodEmoji}>
                {petMood >= 80
                  ? "😊"
                  : petMood >= 60
                    ? "🙂"
                    : petMood >= 40
                      ? "😐"
                      : petMood >= 20
                        ? "😔"
                        : "😢"}
              </span>
            </div>

            <div className={styles.petStatsDisplay}>
              <div className={styles.petStatItem}>
                <span className={styles.statLabel}>Times Petted:</span>
                <span className={styles.statValue}>
                  {userData?.currentPet?.petCount || 0}
                </span>
              </div>
              <div className={styles.petStatItem}>
                <span className={styles.statLabel}>Times Played:</span>
                <span className={styles.statValue}>
                  {userData?.currentPet?.playCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
