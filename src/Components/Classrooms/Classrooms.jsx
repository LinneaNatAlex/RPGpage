import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  arrayRemove,
  increment,
  collection,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { classesList } from "../../data/classesList";
import { useNavigate } from "react-router-dom";
import styles from "./Classrooms.module.css";

// Helper: get year from user object (default 1)
function getUserYear(user) {
  if (user?.graduate || (user?.class && /^graduated?$/i.test(String(user.class)))) {
    return "graduate";
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
  const [cardBackgrounds, setCardBackgrounds] = useState({});

  // Set loading to false immediately since we don't need attendance data
  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDocs(collection(db, "classDescriptions"))
      .then((snap) => {
        if (cancelled) return;
        const map = {};
        snap.forEach((d) => {
          const url = d.data()?.classInfo?.cardBackgroundUrl;
          if (url) map[d.id] = url;
        });
        setCardBackgrounds(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Load last attended once (no snapshot – points/attendance show after reload)
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setLastAttended(snap.data().lastAttendedClass || {});
      }
    });
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
    <div className={styles.page}>
      <h2 className={styles.title}>Classrooms</h2>
      <p className={styles.intro}>
        Select a class to attend. You will only see students from your own year
        in each class session.
      </p>
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
      <div className={styles.grid}>
      {classesList
        .filter((cls) => {
          // Filter out classes that require a minimum year if user hasn't reached it
          if (cls.minYear && userYear !== "graduate") {
            const yearNum = typeof userYear === "number" ? userYear : parseInt(userYear) || 1;
            return yearNum >= cls.minYear;
          }
          return true;
        })
        .map((cls) => {
        const isAttending = attending && attending.classId === cls.id;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const last = lastAttended?.[cls.id] || 0;
        const hasAttendedToday = (now - last) < oneDay;
        const canGetPoints = !hasAttendedToday;
        
        return (
          <div
            key={cls.id}
            className={`${styles.card} ${cardBackgrounds[cls.id] ? styles.cardHasImage : ""}`}
            style={
              cardBackgrounds[cls.id]
                ? { backgroundImage: `url(${cardBackgrounds[cls.id]})` }
                : undefined
            }
          >
            {cardBackgrounds[cls.id] ? <div className={styles.cardScrim} /> : null}
            <div className={styles.cardInner}>
            <h3 className={styles.cardTitle}>{cls.name}</h3>
            <p className={styles.cardText}>{cls.description}</p>
            {isAttending ? (
              <button
                type="button"
                onClick={() => handleLeave(cls)}
                className={styles.leaveBtn}
              >
                Leave
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAttend(cls)}
                className={styles.attendBtn}
              >
                {canGetPoints ? `Attend (+${cls.points} points)` : "Attend (already attended today)"}
              </button>
            )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
