// Imports necessary libraries and hooks, to handle live updates of chat messages from Firebase Firestore.
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

// making this custom hook to fetch messages from the db, can be used in any part of the app!

const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [rpgGrateHall, setRpgGrateHall] = useState([]);

  // ---------------------------Live Chat---------------------------
  useEffect(() => {
    // Listen to the "messages" collection stored in firestore, in real-time.
    // QUOTA OPTIMIZATION: Limit to recent 150 messages to reduce Firebase reads
    const querry = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(150)
    );
    // onSnapshot used to make real-time uppdates in firestore. Making it possible for messages to be sendt back and fourth in real-time
    const unsubscribe = onSnapshot(querry, (snapshot) => {
      const message = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Reverse to show oldest first in UI
      setMessages(message.reverse());
    });
    return () => unsubscribe();
  }, []);
  // Sort messages after  timestamp.
  // -------------------------RPG Grate Hall-------------------------
  useEffect(() => {
    // Listen to the "rpgGrateHall" collection stored in firestore, in real-time.
    // QUOTA OPTIMIZATION: Limit to recent 150 messages to reduce Firebase reads
    const querry = query(
      collection(db, "rpgGrateHall"),
      orderBy("timestamp", "desc"),
      limit(150)
    );
    const unsubscribe = onSnapshot(querry, (snapshot) => {
      const rpgGrateHallMsgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Reverse to show oldest first in UI
      setRpgGrateHall(rpgGrateHallMsgs.reverse());
    });
    return () => unsubscribe();
  }, []);
  return { messages, rpgGrateHall };
};
// Sort messages after timestamp.

export default useChatMessages;
// This is the hooks for both of the Live Chat on the page
