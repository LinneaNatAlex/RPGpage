import styles from "./Profile.module.css";
import { useEffect, useState } from "react";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useAuth } from "../../context/authContext";
import { auth } from "../../firebaseConfig";
import ProfileTextEditor from "../../Components/ProfileTextEditor/ProfileTextEditor";
import parseBBCode from "../../Components/ProfileTextEditor/parseBBCode.js";
import Chat from "../../Components/Chat/Chat";
import FriendsList from "../../Components/FriendsList/FriendsList";
import { isBirthdayToday } from "../../utils/rpgCalendar";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const { user, loading } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
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
          // Sett bursdag state hvis finnes
          if (data.birthdayMonth) setBirthdayMonth(data.birthdayMonth);
          if (data.birthdayDay) setBirthdayDay(data.birthdayDay);
          if (data.birthdayMonth && data.birthdayDay) setBirthdaySaved(true);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user, loading]);

  // Automatisk aldersøkning med fellesmodul
  useEffect(() => {
    if (!userData || !userData.birthdayMonth || !userData.birthdayDay) return;
    const currentYear = new Date().getFullYear();
    if (
      isBirthdayToday(userData.birthdayMonth, userData.birthdayDay) &&
      userData.lastBirthdayYear !== currentYear
    ) {
      // Oppdater alder og siste feirede år i Firestore
      const newAge = (userData.age || 0) + 1;
      updateDoc(doc(db, "users", user.uid), {
        age: newAge,
        lastBirthdayYear: currentYear,
      })
        .then(() => {
          setUserData((prev) => ({
            ...prev,
            age: newAge,
            lastBirthdayYear: currentYear,
          }));
        })
        .catch((err) => console.error("Failed to update age:", err));
    }
  }, [userData, user]);

  const [uploading, setUploading] = useState(false);
  const { uploadImage } = useImageUpload();
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (!url) throw new Error("Ingen URL fra bildeopplasting");
      await updateDoc(doc(db, "users", user.uid), { profileImageUrl: url });
      setUserData((prev) => ({ ...prev, profileImageUrl: url }));
    } catch (err) {
      console.error("Bildeopplasting feilet:", err);
      alert(
        "Kunne ikke laste opp bilde. Prøv igjen.\n" + (err?.message || err)
      );
    } finally {
      setUploading(false);
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
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        {/* ---------------image container------------ */}
        <div className={styles.imageContainer}>
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
                      color: uploading ? "#888" : "#F5EFE0",
                      borderRadius: 8,
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
              {user.displayName}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Class:</strong>
              </p>{" "}
              {userData.class}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Age:</strong>
              </p>{" "}
              {userData.age}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Magical Race:</strong>
              </p>{" "}
              {userData.race}
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
                <span role="img" aria-label="birthday" style={{ fontSize: 18 }}>
                  🎂
                </span>
                <strong>Birthday:</strong>{" "}
                {userData.birthdayMonth && userData.birthdayDay ? (
                  <span style={{ color: "#D4C4A8", fontWeight: 600 }}>
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
                          setUserData((prev) => ({
                            ...prev,
                            birthdayMonth,
                            birthdayDay,
                          }));
                          setBirthdaySaved(true);
                          setEditingBirthday(false);
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
                          value={birthdayMonth}
                          onChange={(e) =>
                            setBirthdayMonth(Number(e.target.value))
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
                            setBirthdayDay(Number(e.target.value))
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
                      color: "#D4C4A8",
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
              {auth.currentUser.metadata.lastLoginAt
                ? new Date(
                    Number(auth.currentUser.metadata.lastLoginAt)
                  ).toLocaleDateString()
                : "N/A"}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Roles</strong>
              </p>{" "}
              {userData.roles?.join(", ")}
            </div>
          </div>
        </div>
      </div>
      {/* -----------------------------PROFILE TEXT----------------------------- */}
      <div className={styles.profileTextContainer}>
        {/* Show existing profile text only when NOT editing */}
        {!showEditor &&
          userData.profileMode === "bbcode" &&
          userData.profileBBCode && (
            <div className={styles.profileText}>
              <h2>Profile Text</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: parseBBCode(userData.profileBBCode),
                }}
              />
              <button
                onClick={() => setShowEditor(true)}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  background:
                    "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                Edit Profile Text
              </button>
            </div>
          )}

        {!showEditor &&
          userData.profileMode === "html" &&
          userData.profileHtml && (
            <div className={styles.profileHtmlContainer}>
              <h2>Profile Text</h2>
              <iframe
                className={styles.profileIframe}
                srcDoc={`<style>${userData.profileCss}</style>${userData.profileHtml}`}
                sandbox=""
              />
              <button
                onClick={() => setShowEditor(true)}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  background:
                    "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                Edit Profile Text
              </button>
            </div>
          )}

        {!showEditor &&
          userData.profileMode === "text" &&
          userData.profileText && (
            <div className={styles.profileText}>
              <h2>Profile Text</h2>
              <p>{userData.profileText}</p>
              <button
                onClick={() => setShowEditor(true)}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  background:
                    "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                Edit Profile Text
              </button>
            </div>
          )}

        {/* Show ProfileTextEditor when no profile text exists OR when editing */}
        {(!userData.profileMode ||
          (!userData.profileText &&
            !userData.profileBBCode &&
            !userData.profileHtml)) &&
          !showEditor && (
            <div className={styles.profileText}>
              <h2>Profile Text</h2>
              <div className={styles.contentContainer}>
                <ProfileTextEditor />
              </div>
            </div>
          )}

        {/* Show ProfileTextEditor when edit button is clicked */}
        {showEditor && (
          <div className={styles.profileText}>
            <h2>Edit Profile Text</h2>
            <div className={styles.contentContainer}>
              <ProfileTextEditor
                initialMode={userData.profileMode}
                initialText={userData.profileText}
                initialHtml={userData.profileHtml}
                initialCss={userData.profileCss}
                initialBBCode={userData.profileBBCode}
                autoEdit={true}
                onSave={async () => {
                  setShowEditor(false);
                  // Fetch updated user data from Firestore
                  try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                      const data = userDoc.data();
                      console.log("Updated user data:", data);
                      setUserData(data);
                    }
                  } catch (error) {
                    console.error("Error fetching updated user data:", error);
                  }
                }}
              />
            </div>
            <button
              onClick={() => setShowEditor(false)}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "linear-gradient(135deg, #8B7A6B 0%, #9B8A7B 100%)",
                color: "#F5EFE0",
                border: "none",
                borderRadius: "8px",
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
  );
};

export default Profile;
