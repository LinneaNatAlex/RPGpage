// imports the necessary modules and components.
import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import styles from "./GreatHall.module.css";
import LiveRP from "../../../Components/LiveRP/LiveRP.jsx";
// Imports Live chat component for role-playing in the Starshade Hall
const DESCRIPTION_KEY = "starshadehall";

const GreatHall = () => {
  const [forumDescription, setForumDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "config", "forumDescriptions"))
      .then((snap) => {
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        const descriptions = data.descriptions || {};
        setForumDescription(descriptions[DESCRIPTION_KEY] || "");
      })
      .catch(() => {
        if (!cancelled) setForumDescription("");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.GreatHallClass}>
      <h1 className={styles.title}>Starshade Hall</h1>
      {forumDescription && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "rgba(245, 239, 224, 0.06)",
            borderLeft: "4px solid rgba(123, 104, 87, 0.6)",
            color: "rgba(212, 196, 168, 0.95)",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {forumDescription}
        </div>
      )}
      <LiveRP />
    </div>
  );
};

export default GreatHall;
