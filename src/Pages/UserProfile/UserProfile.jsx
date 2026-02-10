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
    userData?.birthdayMonth || 1
  );
  const [birthdayDay, setBirthdayDay] = useState(userData?.birthdayDay || 1);
  const [birthdaySaved, setBirthdaySaved] = useState(
    !!userData?.birthdayMonth && !!userData?.birthdayDay
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
      100 - (timeSinceFed / maxStarvationTime) * 100
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
          startTransition(() => {
            setUserData(data);
            // Oppdater pet mood fra global data
            if (data.currentPet?.mood !== undefined) {
              setPetMood(data.currentPet.mood);
            }
            // Sett lastPet og lastPlay fra global data
            if (data.currentPet?.lastPet) {
              setLastPet(data.currentPet.lastPet);
            }
            if (data.currentPet?.lastPlay) {
              setLastPlay(data.currentPet.lastPlay);
            }
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

  // Check if pet can be petted (cooldown check)
  const canPet = () => {
    if (!lastPet) return true;
    const now = new Date();
    const lastTime = lastPet.toDate ? lastPet.toDate() : new Date(lastPet);
    const timeDiff = now - lastTime;
    return timeDiff > 3 * 60 * 1000; // 3 minutes cooldown for petting
  };

  // Check if pet can be played with (cooldown check)
  const canPlay = () => {
    if (!lastPlay) return true;
    const now = new Date();
    const lastTime = lastPlay.toDate ? lastPlay.toDate() : new Date(lastPlay);
    const timeDiff = now - lastTime;
    return timeDiff > 5 * 60 * 1000; // 5 minutes cooldown for playing
  };

  // Update countdown timers every second
  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date();

      // Pet cooldown
      if (lastPet) {
        const lastTime = lastPet.toDate ? lastPet.toDate() : new Date(lastPet);
        const timeDiff = now - lastTime;
        const cooldownTime = 3 * 60 * 1000; // 3 minutes
        const remaining = Math.max(0, cooldownTime - timeDiff);
        setPetTimeLeft(Math.ceil(remaining / 1000));
      }

      // Play cooldown
      if (lastPlay) {
        const lastTime = lastPlay.toDate
          ? lastPlay.toDate()
          : new Date(lastPlay);
        const timeDiff = now - lastTime;
        const cooldownTime = 5 * 60 * 1000; // 5 minutes
        const remaining = Math.max(0, cooldownTime - timeDiff);
        setPlayTimeLeft(Math.ceil(remaining / 1000));
      }

      // Mood decay over time (reduce by 1 every 10 minutes)
      if (userData?.currentPet?.lastInteraction) {
        const lastInteraction = userData.currentPet.lastInteraction.toDate
          ? userData.currentPet.lastInteraction.toDate()
          : new Date(userData.currentPet.lastInteraction);
        const timeSinceInteraction = now - lastInteraction;
        const decayInterval = 10 * 60 * 1000; // 10 minutes
        const decayAmount = Math.floor(timeSinceInteraction / decayInterval);

        if (decayAmount > 0) {
          const newMood = Math.max(0, petMood - decayAmount);
          if (newMood !== petMood) {
            setPetMood(newMood);
            // Update in Firestore
            const userRef = doc(db, "users", userData.uid);
            updateDoc(userRef, {
              "currentPet.mood": newMood,
            }).catch(console.error);
          }
        }
      }
    };

    updateCountdowns(); // Initial update
    const interval = setInterval(updateCountdowns, 1000); // Update every second

    return () => clearInterval(interval);
  }, [lastPet, lastPlay, userData, petMood]);

  // Pet interaction function
  const handlePetInteraction = async (type, moodChange) => {
    if (!user || !userData?.currentPet || isInteracting) return;

    // Check specific cooldown based on type
    if (type === "pet" && !canPet()) return;
    if (type === "play" && !canPlay()) return;

    setIsInteracting(true);

    try {
      const newMood = Math.min(100, petMood + moodChange);
      const now = serverTimestamp();

      // Get current counts and increment
      const currentPetCount = userData.currentPet.petCount || 0;
      const currentPlayCount = userData.currentPet.playCount || 0;

      // Update pet mood and counts in user's document
      const userRef = doc(db, "users", userData.uid);
      const updateData = {
        "currentPet.mood": newMood,
        [`currentPet.last${type.charAt(0).toUpperCase() + type.slice(1)}`]: now,
        "currentPet.lastInteraction": now,
        "currentPet.lastInteractionBy": user.uid,
        "currentPet.lastInteractionType": type,
      };

      // Increment count based on type
      if (type === "pet") {
        updateData["currentPet.petCount"] = currentPetCount + 1;
      } else if (type === "play") {
        updateData["currentPet.playCount"] = currentPlayCount + 1;
      }

      await updateDoc(userRef, updateData);

      // Update local state
      setPetMood(newMood);
      setUserData((prev) => ({
        ...prev,
        currentPet: {
          ...prev.currentPet,
          mood: newMood,
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

      if (type === "pet") {
        setLastPet(now);
      } else if (type === "play") {
        setLastPlay(now);
      }

      // Close modal after interaction
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
            borderRadius: "16px",
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
              borderRadius: "8px",
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
                borderRadius: "16px",
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
                    (r) => r.toLowerCase() === "shadowpatrol"
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
                          setBirthdayMonth(Number(e.target.value))
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
                          setBirthdayDay(Number(e.target.value))
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
                        setBirthdayMonth(Number(e.target.value))
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
                        setBirthdayDay(Number(e.target.value))
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

            {/* Pet Display for other users */}
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
                <div className={styles.petDisplay}>
                  <div className={styles.petImageContainer}>
                    <img
                      src={addImageToItem(userData.currentPet).image}
                      alt={
                        userData.currentPet.customName ||
                        userData.currentPet.name
                      }
                      className={styles.petImage}
                    />
                    <div className={styles.petInfo}>
                      <span className={styles.petName}>
                        {userData.currentPet.customName ||
                          userData.currentPet.name}
                      </span>
                      {/* Pet HP Bar */}
                      <div className={styles.petHpContainer}>
                        <div className={styles.petHpBar}>
                          <div
                            className={styles.petHpFill}
                            style={{
                              width: `${calculatePetHP(userData.currentPet)}%`,
                            }}
                          ></div>
                        </div>
                        <div className={styles.petHpTextContainer}>
                          <span className={styles.petHpText}>
                            {Math.round(calculatePetHP(userData.currentPet))}%
                            HP
                          </span>
                          <button
                            className={styles.petPawButton}
                            onClick={() => {
                              setShowPetInteraction(true);
                            }}
                            title="Interact with pet"
                          >
                            🐾
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
              <style>
                body { 
                  margin: 0; 
                  padding: 1rem; 
                  font-family: "Cinzel", serif;
                  color: #cd853f; /* Strong golden brown for unformatted text */
                  line-height: 1.6;
                  background: transparent;
                }
                /* Hide scrollbars but allow scrolling */
                ::-webkit-scrollbar {
                  display: none;
                }
                html {
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                }
              </style>
              </head>
              <body>
                ${userData.profileText}
              </body>
              </html>
            `}
            style={{
              width: "100%",
              height: "1000vh",
              border: "none",
              borderRadius: "8px",
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

      {/* Pet Interaction Modal */}
      {showPetInteraction && (
        <div className={styles.petInteractionModal}>
          <div className={styles.petInteractionModalContent}>
            <div className={styles.petInteractionHeader}>
              <h3>Pet Interaction</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowPetInteraction(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.petInteractionButtons}>
              <button
                className={styles.petInteractionBtn}
                onClick={() => handlePetInteraction("pet", 5)}
                disabled={isInteracting || !canPet()}
                title="Pet the animal (+5 mood)"
              >
                {isInteracting ? "Petting..." : "Pet"}
              </button>
              <button
                className={styles.petInteractionBtn}
                onClick={() => handlePetInteraction("play", 10)}
                disabled={isInteracting || !canPlay()}
                title="Play with the animal (+10 mood)"
              >
                {isInteracting ? "Playing..." : "Play"}
              </button>
            </div>

            {!canPet() && lastPet && petTimeLeft > 0 && (
              <div className={styles.cooldownText}>
                Pet cooldown: {Math.floor(petTimeLeft / 60)}:
                {(petTimeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}

            {!canPlay() && lastPlay && playTimeLeft > 0 && (
              <div className={styles.cooldownText}>
                Play cooldown: {Math.floor(playTimeLeft / 60)}:
                {(playTimeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}

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
