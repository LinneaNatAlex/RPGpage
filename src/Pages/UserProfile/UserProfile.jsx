// import the necessary libraries and components
import { useState, useEffect } from "react";
import InventoryModal from "../../Components/InventoryModal/InventoryModal";
import { isBirthdayToday } from "../../utils/rpgCalendar";
import parseBBCode from "../../Components/ProfileTextEditor/parseBBCode.js";
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

// state variables and hooks to manage user profile data
const UserProfile = () => {
  // Modal state for inventory (må stå øverst pga hooks)
  const [inventoryOpen, setInventoryOpen] = useState(false);
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
          setUserData(data);
          console.log("Fetched user:", data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setNotFound(true);
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
          setUserData({
            ...userData,
            age: newAge,
            lastBirthdayYear: currentYear,
          });
          setAgeChecked(true);
        })
        .catch((err) => console.error("Failed to update age:", err));
    } else {
      setAgeChecked(true);
    }
  }, [userData, ageChecked, user]);

  if (notFound) return <div>User not found</div>;
  if (!userData) return <div>Loading...</div>;

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
                      textShadow: "0 0 6px #fff, 0 0 12px #ffb6d5",
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
            <h2>Character Details</h2>
            <p>
              <strong>Full Name:</strong>{" "}
              <span className={nameClass}>{userData.displayName}</span>
            </p>
            <p>
              <strong>Class:</strong> {userData.class}
            </p>
            <p>
              <strong>Age:</strong> {userData.age}
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
                    onClick={() => setEditingBirthday(true)}
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
                    setBirthdaySaved(true);
                    setEditingBirthday(false);
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
                      onChange={(e) => setBirthdayMonth(Number(e.target.value))}
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
                      onChange={(e) => setBirthdayDay(Number(e.target.value))}
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
                  setBirthdaySaved(true);
                  setEditingBirthday(false);
                }}
                style={{ margin: "8px 0" }}
              >
                <label style={{ fontSize: 13, marginRight: 6 }}>
                  Month:
                  <select
                    value={birthdayMonth}
                    onChange={(e) => setBirthdayMonth(Number(e.target.value))}
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
                    onChange={(e) => setBirthdayDay(Number(e.target.value))}
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
                  onClick={() => setEditingBirthday(false)}
                >
                  Cancel
                </button>
              </form>
            )}
            <p>
              <strong>Magical Race:</strong>{" "}
              {userData.race &&
              ["Witch", "witch", "witches", "Witches"].includes(userData.race)
                ? "Wizard"
                : userData.race}
            </p>
            <p>
              <strong>Balance:</strong> {userData.currency ?? 1000} Nits
            </p>
            <p>
              <strong>Inventory:</strong>
              <img
                src="/icons/chest.svg"
                alt="Open inventory"
                title="Open inventory"
                style={{
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  verticalAlign: "middle",
                }}
                onClick={() => setInventoryOpen(true)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setInventoryOpen(true);
                }}
                role="button"
                aria-label="Open inventory"
              />
            </p>
            <InventoryModal
              open={inventoryOpen}
              onClose={() => setInventoryOpen(false)}
              inventory={userData.inventory}
            />
          </div>

          <div className={styles.charactinfo}>
            <p>
              <strong>Account Created:</strong>
              {userData.createdAt && userData.createdAt.toDate
                ? userData.createdAt.toDate().toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Last Login:</strong>
              {auth.currentUser?.metadata?.lastLoginAt
                ? new Date(
                    Number(auth.currentUser.metadata.lastLoginAt)
                  ).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Roles:</strong> {userData.roles?.join(", ")}
            </p>
          </div>
        </div>
      </div>
      {/* -----------------------------PROFILE BIO----------------------------- */}
      {/* BIO: HTML eller tekst */}
      {userData.profileMode === "bbcode" && userData.profileBBCode ? (
        <div className={styles.profileTextContainer}>
          <h2>Profile Text</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: parseBBCode(userData.profileBBCode),
            }}
          />
        </div>
      ) : userData.profileMode === "html" &&
        userData.profileHtml &&
        userData.profileCss ? (
        <div className={styles.profileHtmlContainer}>
          <iframe
            className={styles.profileIframe}
            srcDoc={`<style>${userData.profileCss}</style>${userData.profileHtml}`}
            sandbox=""
            height="100vh"
            width="100%"
          />
        </div>
      ) : userData.profileMode === "text" && userData.profileText ? (
        <div className={styles.profileTextContainer}>
          <h2>Profile Text</h2>
          <p>{userData.profileText}</p>
        </div>
      ) : (
        // IF USER HASN NO BIO
        <div>No profile bio available</div>
      )}
    </div>
  );
};

export default UserProfile;
