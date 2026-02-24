// import the necessary libraries and components
import { useState, useEffect, startTransition } from "react";
import useUsers from "../../hooks/useUser";
import useUserData from "../../hooks/useUserData";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  getDocsFromServer,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import styles from "./UserProfile.module.css";
import FriendsList from "../../Components/FriendsList/FriendsList";
import { useAuth } from "../../context/authContext";
import { getRaceDisplayName } from "../../utils/raceColors";
import { isProfileOwnerVip, getProfileDisplayBody } from "../../utils/profileCodeAccess";
import ErrorBoundary from "../../Components/ErrorBoundary/ErrorBoundary";
import { Suspense } from "react";

// state variables and hooks to manage user profile data
const UserProfile = () => {
  const { user } = useAuth();
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);
  const [userDocId, setUserDocId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  // Birthday state
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [birthdayMonth, setBirthdayMonth] = useState(
    userData?.birthdayMonth || 1,
  );
  const [birthdayDay, setBirthdayDay] = useState(userData?.birthdayDay || 1);
  const [birthdaySaved, setBirthdaySaved] = useState(
    !!userData?.birthdayMonth && !!userData?.birthdayDay,
  );

  //  ----------------------------------useEffect----------------------------------
  useEffect(() => {
    // function to fetch user data based on rout parameter 'uid'
    const fetchUserData = async () => {
      try {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocsFromServer(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          startTransition(() => {
            setUserDocId(docSnap.id);
            setUserData(data);
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
  else if (userData.roles?.some((r) => (r || "").toLowerCase() === "teacher" || (r || "").toLowerCase() === "professor"))
    nameClass += ` ${styles.professorName}`;
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
            else if (userData.roles?.some((r) => (r || "").toLowerCase() === "teacher" || (r || "").toLowerCase() === "professor"))
              roleClass += ` ${styles.professorAvatar}`;
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
            const hasVip = isProfileOwnerVip(userData);
            const avatarStyle = inLove
              ? {
                  boxShadow:
                    "0 0 16px 6px #ff69b4, 0 0 32px 12px #ffb6d5 inset",
                  borderRadius: "50%",
                }
              : {};
            const imgEl = (
              <img
                src={userData?.profileImageUrl || "/icons/avatar.svg"}
                alt="Image"
                className={roleClass}
                style={avatarStyle}
              />
            );
            return (
              <>
                {hasVip && !inLove ? (
                  <div className={styles.vipAvatarGlowWrap}>{imgEl}</div>
                ) : (
                  imgEl
                )}
                {hasVip && (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#FFD700",
                      fontWeight: 700,
                      fontSize: "1rem",
                      textShadow: "0 0 10px rgba(255,215,0,0.8), 0 1px 2px rgba(0,0,0,0.5)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    VIP
                  </div>
                )}
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
                  userData.roles?.some((r) => (r || "").toLowerCase() === "teacher" || (r || "").toLowerCase() === "professor")
                )
                  roleNameClass += ` ${styles.professorName}`;
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
                  // Users without staff role: only default (reddish) color on names
                  nameColor = "#B85C4A";
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
              {userData.roles?.map((r) => ["teacher", "professor"].includes((r || "").toLowerCase()) ? "Professor" : (r || "").charAt(0).toUpperCase() + (r || "").slice(1).toLowerCase()).join(", ")}
            </p>

          </div>
        </div>
      </div>
      {/* -----------------------------PROFILE BIO----------------------------- */}
      {userData.profileText ? (
        <div className={styles.profileTextContainer}>
          <h2>Profile Text</h2>
          <iframe
            srcDoc={(() => {
              const ownerIsVip = isProfileOwnerVip(userData);
              let raw = getProfileDisplayBody(userData.profileText || "", ownerIsVip);
              raw = raw.replace(/(\s(?:src|href)\s*=\s*["'])http:\/\//gi, "$1https://");
              const isDark =
                typeof document !== "undefined" &&
                !!document.querySelector('[data-theme="dark"]');
              const bg = isDark ? "#252525" : "#e8ddd4";
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

    </div>
  );
};

export default UserProfile;
