import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  arrayRemove,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { classesList } from "../../data/classesList";
import { useNavigate } from "react-router-dom";

// Helper: get year from user object (default 1)
function getUserYear(user) {
  if (user?.graduate) {
    return 'graduate';
  }
  // Extract year from class field (e.g., "2nd year" -> 2)
  if (user?.class) {
    const match = user.class.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
  return user?.year || 1;
}

export default function Classrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attending, setAttending] = useState(null); // {classId, year}
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(""); // Add error state
  const userYear = getUserYear(user);
  const [lastAttended, setLastAttended] = useState({}); // {classId: timestamp}

  // Set loading to false immediately since we don't need attendance data
  useEffect(() => {
    setLoading(false);
  }, []);

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
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours
    const last = lastAttended?.[cls.id] || 0;
    const hasAttendedToday = (now - last) < oneDay;
    
    // Check if user can get points (only once per day)
    let canGetPoints = !hasAttendedToday;
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
    // Check if user is already in the list to prevent duplicates
    const snap = await getDoc(ref);
    let studentsArray = snap.exists() ? snap.data().students || [] : [];

    // Remove any existing entries for this user (in case of old duplicates)
    studentsArray = studentsArray.filter((s) => s.uid !== user.uid);

    // Add the user with current timestamp
    studentsArray.push(userInfo);

    await updateDoc(ref, {
      students: studentsArray,
    }).catch(async (e) => {
      // If doc doesn't exist, create it
      await setDoc(ref, { students: [userInfo] }, { merge: true });
    });
    // Gi poeng til bruker (kun hvis de ikke har fått poeng i dag)
    const userRef = doc(db, "users", user.uid);
    if (canGetPoints) {
      await updateDoc(userRef, {
        points: increment(cls.points),
        [`lastAttendedClass.${cls.id}`]: now,
      });
    } else {
      // Update timestamp but don't give points
      await updateDoc(userRef, {
        [`lastAttendedClass.${cls.id}`]: now,
      });
    }
    setAttending({ classId: cls.id, year: userYear });
    navigate(`/classrooms/${cls.id}`);
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
        margin: window.innerWidth <= 768 ? "1rem auto" : "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: window.innerWidth <= 768 ? "#FFD700" : "#F5EFE0", // Golden text on mobile
        padding: window.innerWidth <= 768 ? 20 : 40,
        borderRadius: 0,
        boxShadow:
          "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
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
          background:
            "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: 0,
        }}
      />
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: window.innerWidth <= 768 ? "2rem" : "2.5rem",
          fontWeight: 700,
          letterSpacing: "2px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          marginBottom: "1rem",
          textAlign: "center",
          color: window.innerWidth <= 768 ? "#FFD700" : "#F5EFE0", // Golden on mobile
        }}
      >
        Classrooms
      </h2>
      <p
        style={{
          color: window.innerWidth <= 768 ? "#FFE55C" : "#D4C4A8", // Brighter golden on mobile
          fontSize: window.innerWidth <= 768 ? "1rem" : "1.2rem",
          textAlign: "center",
          fontStyle: "italic",
          marginBottom: "2rem",
          textShadow:
            window.innerWidth <= 768 ? "0 1px 2px rgba(0, 0, 0, 0.5)" : "none",
        }}
      >
        Select a class to attend. You will only see students from your own year
        in each class session.
      </p>
      {/* Error Message Display */}
      {errorMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
            color: "#fff",
            padding: "15px 25px",
            borderRadius: 0,
            marginBottom: "25px",
            textAlign: "center",
            fontSize: "1.1rem",
            fontWeight: "600",
            boxShadow: "0 6px 20px rgba(220, 53, 69, 0.4)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {errorMessage}
        </div>
      )}
      {classesList.map((cls) => {
        const isAttending = attending && attending.classId === cls.id;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const last = lastAttended?.[cls.id] || 0;
        const hasAttendedToday = (now - last) < oneDay;
        const canGetPoints = !hasAttendedToday;
        
        return (
          <div
            key={cls.id}
            style={{
              marginBottom: 32,
              padding: 24,
              background: "rgba(245, 239, 224, 0.1)",
              borderRadius: 0,
              border: "2px solid rgba(255, 255, 255, 0.2)",
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontFamily: '"Cinzel", serif',
                fontSize: window.innerWidth <= 768 ? "1.3rem" : "1.5rem",
                color: window.innerWidth <= 768 ? "#FFD700" : "#F5EFE0", // Golden on mobile
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              {cls.name}
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: window.innerWidth <= 768 ? "#FFE55C" : "#D4C4A8", // Brighter golden on mobile
                fontSize: window.innerWidth <= 768 ? "1rem" : "1.1rem",
                lineHeight: 1.5,
                textShadow:
                  window.innerWidth <= 768
                    ? "0 1px 2px rgba(0, 0, 0, 0.5)"
                    : "none",
              }}
            >
              {cls.description}
            </p>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {isAttending ? (
                <button
                  onClick={() => handleLeave(cls)}
                  style={{
                    background:
                      "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
                    padding: "10px 20px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                  }}
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={() => handleAttend(cls)}
                  style={{
                    background:
                      "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
                    padding: "10px 20px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                  }}
                >
                  {canGetPoints ? `Attend (+${cls.points} points)` : "Attend (No points - already attended today)"}
                </button>
              )}
              {/* Attendance count removed - only show active users in class */}
            </div>
            {/* Students list removed as requested - duplicates were showing */}
          </div>
        );
      })}
    </div>
  );
}
