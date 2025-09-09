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
        maxWidth: 700,
        margin: "2rem auto",
        background: "#23232b",
        color: "#fff",
        padding: 24,
        borderRadius: 12,
      }}
    >
      <h2>Classrooms</h2>
      <p style={{ color: "#aaa" }}>
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
              padding: 16,
              background: "#292940",
              borderRadius: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>{cls.name}</h3>
            <p style={{ margin: "4px 0 8px 0", color: "#b3b3b3" }}>
              {cls.description}
            </p>
            <div style={{ marginBottom: 8 }}>
              {isAttending ? (
                <button
                  onClick={() => handleLeave(cls)}
                  style={{
                    background: "#ff6b6b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 16px",
                    marginRight: 8,
                  }}
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={() => handleAttend(cls)}
                  style={{
                    background: "#4fc3f7",
                    color: "#23232b",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 16px",
                    marginRight: 8,
                  }}
                >
                  Attend (+{cls.points} points)
                </button>
              )}
              <span style={{ color: "#a084e8" }}>
                {students.length} attending
              </span>
            </div>
            {students.length > 0 && (
              <div
                style={{
                  background: "#181828",
                  borderRadius: 6,
                  padding: 8,
                  marginTop: 8,
                }}
              >
                <b>Students in this session (Year {userYear}):</b>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {students.map((s) => (
                    <li key={s.uid}>
                      {s.displayName}{" "}
                      <span style={{ color: "#aaa" }}>({s.house})</span>
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
