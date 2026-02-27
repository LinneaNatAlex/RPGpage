// Imports necessary libraries and hooks, to handle live updates of chat messages from Firebase Firestore.
import { useEffect, useState, useRef } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

const onSnapshotError = (err) => {
  if (process.env.NODE_ENV === "development") {
    console.warn("Firestore onSnapshot error:", err?.message || err);
  }
};

// making this custom hook to fetch messages from the db, can be used in any part of the app!

const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [rpgGrateHall, setRpgGrateHall] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------Live Chat---------------------------
  useEffect(() => {
    const querry = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(30)
    );
    const unsubscribe = onSnapshot(
      querry,
      (snapshot) => {
        if (!mountedRef.current) return;
        const message = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(message.reverse());
      },
      onSnapshotError
    );
    return () => unsubscribe();
  }, []);

  // -------------------------RPG Grate Hall-------------------------
  useEffect(() => {
    const querry = query(
      collection(db, "rpgGrateHall"),
      orderBy("timestamp", "desc"),
      limit(150)
    );
    const unsubscribe = onSnapshot(
      querry,
      (snapshot) => {
        if (!mountedRef.current) return;
        const rpgGrateHallMsgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRpgGrateHall(rpgGrateHallMsgs.reverse());
      },
      onSnapshotError
    );
    return () => unsubscribe();
  }, []);

  return { messages, rpgGrateHall };
};
// Sort messages after timestamp.

export default useChatMessages;
// This is the hooks for both of the Live Chat on the page
