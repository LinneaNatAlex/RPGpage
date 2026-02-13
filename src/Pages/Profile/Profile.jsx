import styles from "./Profile.module.css";
import { useEffect, useState, Suspense, startTransition } from "react";
import { flushSync } from "react-dom";
import { getDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useAuth } from "../../context/authContext";
import { auth } from "../../firebaseConfig";
import ProfileTextEditor from "../../Components/ProfileTextEditor/ProfileTextEditor";
import Chat from "../../Components/Chat/Chat";
import FriendsList from "../../Components/FriendsList/FriendsList";
import ErrorBoundary from "../../Components/ErrorBoundary/ErrorBoundary";
import useUserRoles from "../../hooks/useUserRoles";
import { getRaceColor, getRaceDisplayName } from "../../utils/raceColors";
import { addImageToItem } from "../../utils/itemImages";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const { user, loading } = useAuth();
  const { roles } = useUserRoles();
  const [showEditor, setShowEditor] = useState(false);
  const [profileTextKey, setProfileTextKey] = useState(0);
  // Birthday state
  const [birthdayMonth, setBirthdayMonth] = useState(1);
  const [birthdayDay, setBirthdayDay] = useState(1);
  const [birthdaySaved, setBirthdaySaved] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);

  // Pet states
  const [editingPetName, setEditingPetName] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [showPetInteraction, setShowPetInteraction] = useState(false);
  const [petMood, setPetMood] = useState(userData?.currentPet?.mood || 50);
  const [isInteracting, setIsInteracting] = useState(false);
  const [lastPet, setLastPet] = useState(null);
  const [lastPlay, setLastPlay] = useState(null);
  const [petTimeLeft, setPetTimeLeft] = useState(0);
  const [playTimeLeft, setPlayTimeLeft] = useState(0);

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

  // Update pet name
  const updatePetName = async (customName) => {
    if (!user || !userData.currentPet) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const updatedPet = {
        ...userData.currentPet,
        customName: customName,
      };

      await updateDoc(userRef, { currentPet: updatedPet });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        currentPet: updatedPet,
      }));

      setEditingPetName(false);
      setNewPetName("");
    } catch (error) {
      console.error("Error updating pet name:", error);
    }
  };

  const getTodayString = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const DAILY_PET_LIMIT = 3;
  const DAILY_PLAY_LIMIT = 3;

  // Pet/play: max 3 per day each, and not allowed at 0% HP
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

  // Mood decay over time (reduce by 1 every 5 minutes when not interacted with)
  useEffect(() => {
    const runDecay = () => {
      const now = new Date();
      if (userData?.currentPet?.lastInteraction) {
        const lastInteraction = userData.currentPet.lastInteraction.toDate
          ? userData.currentPet.lastInteraction.toDate()
          : new Date(userData.currentPet.lastInteraction);
        const timeSinceInteraction = now - lastInteraction;
        const decayInterval = 5 * 60 * 1000; // 5 minutes – gradual visible decay
        const decayAmount = Math.floor(timeSinceInteraction / decayInterval);
        if (decayAmount > 0) {
          const newMood = Math.max(0, petMood - decayAmount);
          if (newMood !== petMood) {
            setPetMood(newMood);
            const userRef = doc(db, "users", userData.uid || user?.uid);
            updateDoc(userRef, { "currentPet.mood": newMood }).catch(() => {});
          }
        }
      }
    };
    runDecay();
    const interval = setInterval(runDecay, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [userData, petMood, user]);

  // Pet interaction function (max 3 pet + 3 play per day; blocked at 0% HP)
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
      const userRef = doc(db, "users", userData.uid || user.uid);
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

  // This uses the auth context to get the current user! teck loding state!

  useEffect(() => {
    if (loading || !user) return;
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
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
            updateDoc(userDocRef, reset).catch(() => {});
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
          setUserData(dataToSet);
          if (dataToSet.birthdayMonth)
            setBirthdayMonth(dataToSet.birthdayMonth);
          if (dataToSet.birthdayDay) setBirthdayDay(dataToSet.birthdayDay);
          if (dataToSet.birthdayMonth && dataToSet.birthdayDay)
            setBirthdaySaved(true);
          if (dataToSet.currentPet?.mood !== undefined) {
            setPetMood(dataToSet.currentPet.mood);
          }
          if (dataToSet.currentPet?.lastPet)
            setLastPet(dataToSet.currentPet.lastPet);
          if (dataToSet.currentPet?.lastPlay)
            setLastPlay(dataToSet.currentPet.lastPlay);
        } else {
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user, loading]);

  const [uploading, setUploading] = useState(false);
  const { uploadImage } = useImageUpload();
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    startTransition(() => setUploading(true));
    try {
      const url = await uploadImage(file);
      if (!url) throw new Error("Ingen URL fra bildeopplasting");
      await updateDoc(doc(db, "users", user.uid), { profileImageUrl: url });
      startTransition(() => {
        setUserData((prev) => ({ ...prev, profileImageUrl: url }));
      });
    } catch (err) {
      console.error("Bildeopplasting feilet:", err);
      alert(
        "Kunne ikke laste opp bilde. Prøv igjen.\n" + (err?.message || err),
      );
    } finally {
      startTransition(() => setUploading(false));
    }
  };

  if (loading || !userData) {
    // If the user data is still loading or not available, show a loading state
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // -----------------------------PROFILE CONTENT-----------------------------
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
        <div className={styles.profileWrapper}>
          <div className={styles.profileContentWidth}>
            <div className={styles.profileContainer}>
              {/* ---------------image container------------ */}
              <div className={styles.imageContainer}>
                {(() => {
                  let roleClass = styles.profileImage;
                  if (
                    userData.roles?.some(
                      (r) => r.toLowerCase() === "headmaster",
                    )
                  )
                    roleClass += ` ${styles.headmasterAvatar}`;
                  else if (
                    userData.roles?.some((r) => r.toLowerCase() === "teacher")
                  )
                    roleClass += ` ${styles.teacherAvatar}`;
                  else if (
                    userData.roles?.some(
                      (r) => r.toLowerCase() === "shadowpatrol",
                    )
                  )
                    roleClass += ` ${styles.shadowPatrolAvatar}`;
                  else if (
                    userData.roles?.some((r) => r.toLowerCase() === "admin")
                  )
                    roleClass += ` ${styles.adminAvatar}`;
                  else if (
                    userData.roles?.some((r) => r.toLowerCase() === "archivist")
                  )
                    roleClass += ` ${styles.archivistAvatar}`;
                  return (
                    <>
                      <img
                        src={userData?.profileImageUrl || "/icons/avatar.svg"}
                        alt="Image"
                        className={roleClass}
                        loading="lazy"
                      />
                      <label
                        className={styles.editBtn}
                        style={{ marginTop: 20, display: "block" }}
                      >
                        <input
                          id="profile-avatar-upload"
                          name="profileAvatar"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleImageChange}
                          disabled={uploading}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            background: uploading
                              ? "#ccc"
                              : "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                            color: uploading ? "#888" : "#FFFFFF",
                            borderRadius: 0,
                            padding: "8px 20px",
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: uploading ? "not-allowed" : "pointer",
                            border: "2px solid rgba(255, 255, 255, 0.2)",
                            boxShadow:
                              "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {uploading ? "Uploading..." : "Choose file"}
                        </span>
                      </label>
                      {/* Profile likes overview – how many have liked your profile */}
                      <div className={styles.profileLikesOverview}>
                        <span className={styles.profileLikesOverviewIcon}>
                          ❤️
                        </span>
                        <span className={styles.profileLikesOverviewText}>
                          {Array.isArray(userData.profileLikedBy)
                            ? userData.profileLikedBy.length
                            : 0}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              {/* -------------Character details-------------- */}
              <div className={styles.characterDetailsContainer}>
                <div className={styles.charactinfo}>
                  <h2>Character Details</h2>
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Full Name:</strong>
                    </p>{" "}
                    {(() => {
                      let nameClass = styles.caracterDetails;
                      let nameColor = "#FFFFFF"; // Default color

                      if (roles?.some((r) => r.toLowerCase() === "headmaster"))
                        nameClass += ` ${styles.headmasterName}`;
                      else if (
                        roles?.some((r) => r.toLowerCase() === "teacher")
                      )
                        nameClass += ` ${styles.teacherName}`;
                      else if (
                        roles?.some((r) => r.toLowerCase() === "shadowpatrol")
                      )
                        nameClass += ` ${styles.shadowPatrolName}`;
                      else if (roles?.some((r) => r.toLowerCase() === "admin"))
                        nameClass += ` ${styles.adminName}`;
                      else if (
                        roles?.some((r) => r.toLowerCase() === "archivist")
                      )
                        nameClass += ` ${styles.archivistName}`;
                      else {
                        // Use race color for students without roles
                        nameColor = getRaceColor(userData?.race);
                      }

                      return (
                        <span
                          className={nameClass}
                          style={{
                            color: nameColor,
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                          }}
                        >
                          {user.displayName}
                        </span>
                      );
                    })()}
                  </div>
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Class:</strong>
                    </p>{" "}
                    {userData.class}
                  </div>
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Magical Race:</strong>
                    </p>{" "}
                    {userData.race}
                  </div>

                  {/* Status Display */}
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Status:</strong>
                    </p>{" "}
                    <span style={{ color: "#cccccc" }}>Regular User</span>
                  </div>

                  {/* Bursdag: vis og la brukeren velge hvis ikke satt */}
                  <div className={styles.caracterDetails}>
                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        margin: 0,
                      }}
                    >
                      <span
                        role="img"
                        aria-label="birthday"
                        style={{ fontSize: 18 }}
                      >
                        🎂
                      </span>
                      <strong>Birthday:</strong>{" "}
                      {userData.birthdayMonth && userData.birthdayDay ? (
                        <span style={{ color: "#FFE4B5", fontWeight: 600 }}>
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
                      ) : null}
                      {user?.uid === userData.uid &&
                        (!userData.birthdayMonth || !userData.birthdayDay) && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!user) return;
                              try {
                                await updateDoc(doc(db, "users", user.uid), {
                                  birthdayMonth,
                                  birthdayDay,
                                });
                                startTransition(() => {
                                  setUserData((prev) => ({
                                    ...prev,
                                    birthdayMonth,
                                    birthdayDay,
                                  }));
                                });
                                startTransition(() => {
                                  setBirthdaySaved(true);
                                  setEditingBirthday(false);
                                });
                              } catch (err) {
                                alert("Could not save birthday. Try again.");
                              }
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginLeft: 8,
                            }}
                          >
                            <label style={{ fontSize: 13, marginRight: 6 }}>
                              Month:
                              <select
                                id="profile-birthday-month"
                                name="birthdayMonth"
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
                                id="profile-birthday-day"
                                name="birthdayDay"
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
                            <button
                              type="submit"
                              style={{ fontSize: 12, marginLeft: 8 }}
                            >
                              Save
                            </button>
                          </form>
                        )}
                      {!userData.birthdayMonth || !userData.birthdayDay ? (
                        <span
                          style={{
                            color: "#FFE4B5",
                            fontStyle: "italic",
                            marginLeft: 6,
                          }}
                        >
                          Not set
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {/* Inventory fjernet fra karakterinfo/profilvisning */}
                </div>
                <div className={styles.charactinfo}>
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Account Created:</strong>
                    </p>{" "}
                    {userData.createdAt?.toDate().toLocaleDateString()}
                  </div>
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Last Login:</strong>
                    </p>{" "}
                    {userData.lastLogin
                      ? userData.lastLogin.toDate().toLocaleString()
                      : "N/A"}
                  </div>
                  <div className={styles.caracterDetails}>
                    <p>
                      <strong>Roles</strong>
                    </p>{" "}
                    {userData.roles?.join(", ")}
                  </div>

                  {/* Pet: paw button only – opens popup with full pet details */}
                  {userData.currentPet && (
                    <div className={styles.caracterDetails}>
                      <p>
                        <strong>Pet:</strong>
                      </p>
                      <button
                        type="button"
                        className={styles.petPawOnlyButton}
                        onClick={() => setShowPetInteraction(true)}
                        title="View pet"
                        aria-label="View pet"
                      >
                        🐾
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* -----------------------------PROFILE TEXT----------------------------- */}
            <div
              key={showEditor ? "editor" : "read"}
              className={styles.profileTextContainer}
              data-profiletextview={showEditor ? "editor" : "read"}
            >
              {/* Når vi ikke redigerer: kun lesevisning (iframe) – ProfileTextEditor rendres aldri her */}
              {!showEditor && (
                <div
                  className={styles.profileText}
                  key={`read-${profileTextKey}`}
                >
                  <h2>Profile Text</h2>
                  <iframe
                    key={`iframe-${profileTextKey}`}
                    srcDoc={(() => {
                      let raw = (userData.profileText || "")
                        .replace("{{code}}", "")
                        .replace("{{/code}}", "");
                      raw = raw.replace(
                        /(\s(?:src|href)\s*=\s*["'])http:\/\//gi,
                        "$1https://",
                      );
                      const isDark =
                        typeof document !== "undefined" &&
                        !!document.querySelector('[data-theme="dark"]');
                      const bg = isDark ? "#1a1a1a" : "#EBE1D7";
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
                  <button
                    onClick={() => startTransition(() => setShowEditor(true))}
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem 1rem",
                      background:
                        "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    Edit Profile Text
                  </button>
                </div>
              )}

              {/* ProfileTextEditor kun når bruker har trykket Edit */}
              {showEditor && (
                <div className={styles.profileText}>
                  <h2>Edit Profile Text</h2>
                  <Suspense
                    fallback={
                      <div style={{ padding: "1rem", textAlign: "center" }}>
                        Loading editor...
                      </div>
                    }
                  >
                    <ProfileTextEditor
                        initialText={userData.profileText}
                        autoEdit={true}
                        onSave={async (savedText) => {
                          if (savedText != null) {
                            setUserData((prev) => ({
                              ...prev,
                              profileText: savedText,
                            }));
                            setProfileTextKey((k) => k + 1);
                          }
                          setShowEditor(false);
                          flushSync(() => {});
                          try {
                            const userDocRef = doc(db, "users", user.uid);
                            const userDoc = await getDoc(userDocRef);
                            if (userDoc.exists()) {
                              const data = userDoc.data();
                              setUserData((prev) => ({ ...prev, ...data }));
                            }
                          } catch (error) {
                            console.error(
                              "Error fetching updated user data:",
                              error,
                            );
                          }
                        }}
                      />
                  </Suspense>
                  <button
                    onClick={() => startTransition(() => setShowEditor(false))}
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem 1rem",
                      background:
                        "linear-gradient(135deg, #8B7A6B 0%, #9B8A7B 100%)",
                      color: "#F5EFE0",
                      border: "none",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {/* -----------------------------CHAT BAR----------------------------- */}
            </div>
          </div>
        </div>
      </Suspense>

      {/* Pet Interaction Modal */}
      {showPetInteraction && (
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
              {/* Rename Pet in modal (own profile) */}
              <div className={styles.petNameEditor}>
                {!editingPetName ? (
                  <button
                    onClick={() => {
                      setEditingPetName(true);
                      setNewPetName(
                        userData.currentPet.customName ||
                          userData.currentPet.name ||
                          "",
                      );
                    }}
                    className={styles.editPetNameBtn}
                  >
                    {userData.currentPet.customName
                      ? "Rename Pet"
                      : "Give Pet Name"}
                  </button>
                ) : (
                  <div className={styles.petNameInputContainer}>
                    <input
                      id="profile-pet-name-modal"
                      name="petName"
                      type="text"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="Enter pet name..."
                      className={styles.petNameInput}
                      maxLength="20"
                    />
                    <div className={styles.petNameButtons}>
                      <button
                        onClick={() => updatePetName(newPetName)}
                        className={styles.savePetNameBtn}
                        disabled={!newPetName.trim()}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingPetName(false);
                          setNewPetName("");
                        }}
                        className={styles.cancelPetNameBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
    </ErrorBoundary>
  );
};

export default Profile;
