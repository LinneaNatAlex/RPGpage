import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

// making this hook so the messages from the db can be used in any part of the app. ^^

const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [rpgGrateHall, setRpgGrateHall] = useState([]);

  useEffect(() => {
    // message, time, and the order in wich message that are oldes 'asc' the older message first
    const querry = query(
      collection(db, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(querry, (snapshot) => {
      const message = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(message);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // message, time, and the order in wich message that are oldes 'asc' the older message first
    const querry = query(
      collection(db, "rpgGrateHall"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(querry, (snapshot) => {
      const rpgGrateHall = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRpgGrateHall(rpgGrateHall);
    });
    return () => unsubscribe();
  }, []);
  return { messages, rpgGrateHall };
};

export default useChatMessages;
