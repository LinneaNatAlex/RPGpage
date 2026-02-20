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
      <LiveRP descriptionText={forumDescription} />
    </div>
  );
};

export default GreatHall;
