import styles from "./Profile.module.css";
import { useEffect, useState, Suspense, startTransition } from "react";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useAuth } from "../../context/authContext";
import { auth } from "../../firebaseConfig";
import ProfileTextEditor from "../../Components/ProfileTextEditor/ProfileTextEditor";
import Chat from "../../Components/Chat/Chat";
import FriendsList from "../../Components/FriendsList/FriendsList";
import { isBirthdayToday } from "../../utils/rpgCalendar";
import ErrorBoundary from "../../Components/ErrorBoundary/ErrorBoundary";
import useUserRoles from "../../hooks/useUserRoles";
import useVipStatus from "../../hooks/useVipStatus";
import { getRaceColor, getRaceDisplayName } from "../../utils/raceColors";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const { user, loading } = useAuth();
  const { roles } = useUserRoles();
  const { isVip, daysRemaining } = useVipStatus();
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
          startTransition(() => {
            setUserData(data);
            // Sett bursdag state hvis finnes
            if (data.birthdayMonth)
              startTransition(() => setBirthdayMonth(data.birthdayMonth));
            if (data.birthdayDay)
              startTransition(() => setBirthdayDay(data.birthdayDay));
            if (data.birthdayMonth && data.birthdayDay)
              startTransition(() => setBirthdaySaved(true));
          });
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
      startTransition(() => {
        updateDoc(doc(db, "users", user.uid), {
          age: newAge,
          lastBirthdayYear: currentYear,
        })
          .then(() => {
            startTransition(() => {
              setUserData((prev) => ({
                ...prev,
                age: newAge,
                lastBirthdayYear: currentYear,
              }));
            });
          })
          .catch((err) => console.error("Failed to update age:", err));
      });
    }
  }, [userData, user]);

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
        "Kunne ikke laste opp bilde. Prøv igjen.\n" + (err?.message || err)
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
        <div className={styles.profileWrapper}>
          <div className={styles.profileContainer}>
            {/* ---------------image container------------ */}
            <div className={styles.imageContainer}>
              {(() => {
                let roleClass = styles.profileImage;
                if (
                  userData.roles?.some((r) => r.toLowerCase() === "headmaster")
                )
                  roleClass += ` ${styles.headmasterAvatar}`;
                else if (
                  userData.roles?.some((r) => r.toLowerCase() === "teacher")
                )
                  roleClass += ` ${styles.teacherAvatar}`;
                else if (
                  userData.roles?.some(
                    (r) => r.toLowerCase() === "shadowpatrol"
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
                  {(() => {
                    let nameClass = styles.caracterDetails;
                    let nameColor = "#FFFFFF"; // Default color

                    if (roles?.some((r) => r.toLowerCase() === "headmaster"))
                      nameClass += ` ${styles.headmasterName}`;
                    else if (roles?.some((r) => r.toLowerCase() === "teacher"))
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

                {/* VIP Status Display */}
                <div className={styles.caracterDetails}>
                  <p>
                    <strong>Status:</strong>
                  </p>{" "}
                  {isVip ? (
                    <span
                      style={{
                        color: "#ffd700",
                        fontWeight: "bold",
                        textShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
                      }}
                    >
                      👑 VIP ({daysRemaining || 0} days remaining)
                    </span>
                  ) : (
                    <span style={{ color: "#cccccc" }}>
                      Regular User
                      <button
                        onClick={() => {
                          try {
                            window.open(
                              "https://buy.stripe.com/6oU3cogeV6NWfi3cA33VC00",
                              "_blank"
                            );
                          } catch (error) {
                            console.error(
                              "Error opening VIP purchase page:",
                              error
                            );
                            alert(
                              "Unable to open purchase page. Please visit: https://buy.stripe.com/6oU3cogeV6NWfi3cA33VC00"
                            );
                          }
                        }}
                        style={{
                          marginLeft: "10px",
                          background:
                            "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                          color: "#000",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          try {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 4px 16px rgba(255, 215, 0, 0.5)";
                          } catch (error) {
                            console.error("Error in button hover:", error);
                          }
                        }}
                        onMouseLeave={(e) => {
                          try {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                              "0 2px 8px rgba(255, 215, 0, 0.3)";
                          } catch (error) {
                            console.error("Error in button hover:", error);
                          }
                        }}
                      >
                        👑 Buy VIP
                      </button>
                    </span>
                  )}
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
            {!showEditor && userData.profileText && (
              <div className={styles.profileText}>
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
                    minHeight: "200px",
                    border: "none",
                    borderRadius: "8px",
                    background: "transparent",
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

            {/* Show ProfileTextEditor when no profile text exists */}
            {!userData.profileText && !showEditor && (
              <div className={styles.profileText}>
                <h2>Profile Text</h2>
                <div className={styles.contentContainer}>
                  <Suspense
                    fallback={
                      <div style={{ padding: "1rem", textAlign: "center" }}>
                        Loading editor...
                      </div>
                    }
                  >
                    <ProfileTextEditor />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Show ProfileTextEditor when edit button is clicked */}
            {showEditor && (
              <div className={styles.profileText}>
                <h2>Edit Profile Text</h2>
                <div className={styles.contentContainer}>
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
                      onSave={async () => {
                        startTransition(() => setShowEditor(false));
                        // Fetch updated user data from Firestore
                        try {
                          const userDocRef = doc(db, "users", user.uid);
                          const userDoc = await getDoc(userDocRef);
                          if (userDoc.exists()) {
                            const data = userDoc.data();
                            console.log("Updated user data:", data);
                            startTransition(() => {
                              setUserData(data);
                            });
                          }
                        } catch (error) {
                          console.error(
                            "Error fetching updated user data:",
                            error
                          );
                        }
                      }}
                    />
                  </Suspense>
                </div>
                <button
                  onClick={() => startTransition(() => setShowEditor(false))}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    background:
                      "linear-gradient(135deg, #8B7A6B 0%, #9B8A7B 100%)",
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
      </Suspense>
    </ErrorBoundary>
  );
};

export default Profile;
