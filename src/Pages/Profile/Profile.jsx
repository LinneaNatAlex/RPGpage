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
import { getRaceDisplayName } from "../../utils/raceColors";
import {
  isProfileOwnerVip,
  getProfileDisplayBody,
} from "../../utils/profileCodeAccess";

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

  // This uses the auth context to get the current user! teck loding state!

  useEffect(() => {
    if (loading || !user) return;
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          if (data.birthdayMonth)
            setBirthdayMonth(data.birthdayMonth);
          if (data.birthdayDay) setBirthdayDay(data.birthdayDay);
          if (data.birthdayMonth && data.birthdayDay)
            setBirthdaySaved(true);
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
      if (!url) throw new Error("No URL from image upload");
      await updateDoc(doc(db, "users", user.uid), { profileImageUrl: url });
      startTransition(() => {
        setUserData((prev) => ({ ...prev, profileImageUrl: url }));
      });
    } catch (err) {
      console.error("Image upload failed:", err);
      alert(
        "Could not upload image. Try again.\n" + (err?.message || err),
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
                    userData.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
                  )
                    roleClass += ` ${styles.professorAvatar}`;
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
                  const hasVip = isProfileOwnerVip(userData);
                  const imgEl = (
                    <img
                      src={userData?.profileImageUrl || "/icons/avatar.svg"}
                      alt="Image"
                      className={roleClass}
                      loading="lazy"
                    />
                  );
                  return (
                    <>
                      {hasVip ? (
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
                            textShadow:
                              "0 0 10px rgba(255,215,0,0.8), 0 1px 2px rgba(0,0,0,0.5)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          VIP
                        </div>
                      )}
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
                        roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
                      )
                        nameClass += ` ${styles.professorName}`;
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
                        // Users without staff role: only default (reddish) color on names
                        nameColor = "#B85C4A";
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
                    {userData.roles?.map((r) => ["teacher", "professor"].includes((r || "").toLowerCase()) ? "Professor" : (r || "").charAt(0).toUpperCase() + (r || "").slice(1).toLowerCase()).join(", ")}
                  </div>

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
                      const ownerIsVip = isProfileOwnerVip(userData);
                      let raw = getProfileDisplayBody(userData.profileText || "", ownerIsVip);
                      raw = raw.replace(
                        /(\s(?:src|href)\s*=\s*["'])http:\/\//gi,
                        "$1https://",
                      );
                      const isDark =
                        typeof document !== "undefined" &&
                        !!document.querySelector('[data-theme="dark"]');
                      const bg = isDark ? "#252525" : "#EBE1D7";
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

    </ErrorBoundary>
  );
};

export default Profile;

