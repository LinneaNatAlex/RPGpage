import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { classesList } from "../../data/classesList";
import { useNavigate } from "react-router-dom";

// Helper: get year from user object (default 1)
function getUserYear(user) {
  return user?.year || 1;
}

export default function Classrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attending, setAttending] = useState(null); // {classId, year}
  const [attendance, setAttendance] = useState({}); // {classId: {year: [user,...]}}
  const [loading, setLoading] = useState(true);
  const userYear = getUserYear(user);
  const [lastAttended, setLastAttended] = useState({}); // {classId: timestamp}

  // Listen for attendance changes in Firestore
  useEffect(() => {
    const unsubList = [];
    classesList.forEach((cls) => {
      const ref = doc(db, "classAttendance", `${cls.id}-year${userYear}`);
      const unsub = onSnapshot(ref, (snap) => {
        setAttendance((prev) => ({
          ...prev,
          [cls.id]: snap.exists() ? snap.data().students || [] : [],
        }));
      });
      unsubList.push(unsub);
    });
    setLoading(false);
    return () => unsubList.forEach((u) => u());
  }, [userYear]);

  // Track last attended per class (from user doc)
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLastAttended(snap.data().lastAttendedClass || {});
      }
    });
    return () => unsub();
  }, [user]);

  // Attend a class (add user to attendance list for class+year)
  async function handleAttend(cls) {
    if (!user) return;
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour
    const last = lastAttended?.[cls.id] || 0;
    if (now - last < cooldown) {
      alert("You can only attend this class once per hour.");
      return;
    }
    const ref = doc(db, "classAttendance", `${cls.id}-year${userYear}`);
    // Try to get roles from user object (if present)
    // Fetch latest roles from Firestore
    let roles = [];
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && Array.isArray(userDoc.data().roles)) {
        roles = userDoc.data().roles;
      }
    } catch (e) {
      // fallback to user.roles if fetch fails
      roles = Array.isArray(user.roles) ? user.roles : [];
    }
    const userInfo = {
      uid: user.uid,
      displayName: user.displayName || user.email || "Unknown",
      house: user.house || user.race || "?",
      year: userYear,
      attendedAt: now,
      roles: roles,
    };
    await updateDoc(ref, {
      students: arrayUnion(userInfo),
    }).catch(async (e) => {
      // If doc doesn't exist, create it
      await updateDoc(ref, { students: [userInfo] }).catch(() => {});
    });
    // Gi poeng til bruker
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      points: increment(cls.points),
      [`lastAttendedClass.${cls.id}`]: now,
    });
    setAttending({ classId: cls.id, year: userYear });
    if (cls.id === "potions") {
      navigate(`/ClassRooms/potions`);
    } else {
      navigate(`/classrooms/${cls.id}`);
    }
  }

  // Leave class (remove user from attendance list)
  async function handleLeave(cls) {
    if (!user) return;
    const ref = doc(db, "classAttendance", `${cls.id}-year${userYear}`);
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const userInfo = {
      uid: user.uid,
      displayName: user.displayName || user.email || "Unknown",
      house: user.house || user.race || "?",
      year: userYear,
      attendedAt: 0, // Not used for removal, but keep structure
      roles: roles,
    };
    await updateDoc(ref, {
      students: arrayRemove(userInfo),
    });
    setAttending(null);
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        padding: 40,
        borderRadius: 20,
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
        border: "3px solid #7B6857",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: "20px 20px 0 0",
        }}
      />
      <h2 style={{
        fontFamily: '"Cinzel", serif',
        fontSize: "2.5rem",
        fontWeight: 700,
        letterSpacing: "2px",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        marginBottom: "1rem",
        textAlign: "center"
      }}>Classrooms</h2>
      <p style={{ 
        color: "#D4C4A8",
        fontSize: "1.2rem",
        textAlign: "center",
        fontStyle: "italic",
        marginBottom: "2rem"
      }}>
        Select a class to attend. You will only see students from your own year
        in each class session.
      </p>
      {classesList.map((cls) => {
        if (cls.name === "Alchemy & Potions") return null; // Skip 'Alchemy & Potions'
        const students = attendance[cls.id] || [];
        const isAttending = attending && attending.classId === cls.id;
        return (
          <div
            key={cls.id}
            style={{
              marginBottom: 32,
              padding: 24,
              background: "rgba(245, 239, 224, 0.1)",
              borderRadius: 16,
              border: "2px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3 style={{ 
              margin: "0 0 12px 0",
              fontFamily: '"Cinzel", serif',
              fontSize: "1.5rem",
              color: "#F5EFE0",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
            }}>{cls.name}</h3>
            <p style={{ 
              margin: "0 0 16px 0", 
              color: "#D4C4A8",
              fontSize: "1.1rem",
              lineHeight: 1.5
            }}>
              {cls.description}
            </p>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              {isAttending ? (
                <button
                  onClick={() => handleLeave(cls)}
                  style={{
                    background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 12,
                    padding: "10px 20px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                  }}
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={() => handleAttend(cls)}
                  style={{
                    background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 12,
                    padding: "10px 20px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                  }}
                >
                  Attend (+{cls.points} points)
                </button>
              )}
              <span style={{ 
                color: "#D4C4A8",
                fontSize: "1.1rem",
                fontWeight: 600,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
              }}>
                {students.length} attending
              </span>
            </div>
            {students.length > 0 && (
              <div
                style={{
                  background: "rgba(212, 196, 168, 0.1)",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  border: "1px solid rgba(212, 196, 168, 0.3)",
                }}
              >
                <b style={{
                  color: "#D4C4A8",
                  fontSize: "1.1rem",
                  fontFamily: '"Cinzel", serif',
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
                }}>Students in this session (Year {userYear}):</b>
                <ul style={{ 
                  margin: "12px 0 0 0", 
                  paddingLeft: 20,
                  listStyle: "none"
                }}>
                  {students.map((s) => (
                    <li key={s.uid} style={{
                      marginBottom: 8,
                      padding: "8px 12px",
                      background: "rgba(245, 239, 224, 0.1)",
                      borderRadius: 8,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#F5EFE0",
                      fontSize: "1rem"
                    }}>
                      {s.displayName}{" "}
                      <span style={{ 
                        color: "#D4C4A8",
                        fontStyle: "italic"
                      }}>({s.house})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
