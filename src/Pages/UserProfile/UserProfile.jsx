// import the necessary libraries and components
import { useState, useEffect, startTransition } from "react";
import { isBirthdayToday } from "../../utils/rpgCalendar";
import useUsers from "../../hooks/useUser";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
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
  // Birthday state
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthdayMonth, setBirthdayMonth] = useState(
    userData?.birthdayMonth || 1
  );
  const [birthdayDay, setBirthdayDay] = useState(userData?.birthdayDay || 1);
  const [birthdaySaved, setBirthdaySaved] = useState(
    !!userData?.birthdayMonth && !!userData?.birthdayDay
  );
  // For å hindre dobbel feiring
  const [ageChecked, setAgeChecked] = useState(false);

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
          });
          console.log("Fetched user:", data);
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

  // --- Automatisk aldersøkning på RPG-bursdag med fellesmodul ---
  useEffect(() => {
    if (
      !userData ||
      !userData.birthdayMonth ||
      !userData.birthdayDay ||
      ageChecked
    )
      return;
    const currentYear = new Date().getFullYear();
    if (
      isBirthdayToday(userData.birthdayMonth, userData.birthdayDay) &&
      user?.uid === userData.uid &&
      userData.lastBirthdayYear !== currentYear
    ) {
      // Oppdater alder og siste feirede år i Firestore
      const newAge = (userData.age || 0) + 1;
      const userRef = doc(db, "users", userData.uid);
      updateDoc(userRef, {
        age: newAge,
        lastBirthdayYear: currentYear,
      })
        .then(() => {
          startTransition(() => {
            setUserData({
              ...userData,
              age: newAge,
              lastBirthdayYear: currentYear,
            });
          });
          startTransition(() => {
            setAgeChecked(true);
          });
        })
        .catch((err) => console.error("Failed to update age:", err));
    } else {
      startTransition(() => {
        setAgeChecked(true);
      });
    }
  }, [userData, ageChecked, user]);

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
                Age:
              </strong>{" "}
              {userData.age}
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
                      "Januar",
                      "Februar",
                      "Mars",
                      "April",
                      "Mai",
                      "Juni",
                      "Juli",
                      "August",
                      "September",
                      "Oktober",
                      "November",
                      "Desember",
                    ][userData.birthdayMonth - 1]
                  }
                  , Day {userData.birthdayDay}
                </span>
                {user?.uid === userData.uid && !birthdaySaved && (
                  <button
                    onClick={() =>
                      startTransition(() => setEditingBirthday(true))
                    }
                    style={{ marginLeft: 8, fontSize: 11 }}
                  >
                    Edit
                  </button>
                )}
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
              {auth.currentUser?.metadata?.lastLoginAt
                ? new Date(
                    Number(auth.currentUser.metadata.lastLoginAt)
                  ).toLocaleDateString()
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
                        <span className={styles.petHpText}>
                          {Math.round(calculatePetHP(userData.currentPet))}% HP
                        </span>
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
            }}
            title="Profile Text"
          />
        </div>
      ) : (
        // IF USER HAS NO BIO
        <div>No profile bio available</div>
      )}
    </div>
  );
};

export default UserProfile;
