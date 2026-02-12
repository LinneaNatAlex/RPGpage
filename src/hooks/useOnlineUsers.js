// imports the necessary hooks and firebase functions to get the online users
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, where } from "firebase/firestore"; //where is used to make a query that filters the online users

// this costume hook is used to fetch the online users from the firestore in real-time, makin it possible to use it in any part of the app
const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // makes a query in firestore to filter online user.
    const querry = query(collection(db, "users"), where("online", "==", true));
    const unsubscribe = onSnapshot(querry, (snapshot) => {
      const now = Date.now();
      const onlineUsers = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return { ...data, id: docSnap.id };
        })
        .filter((u) => !u.invisibleUntil || u.invisibleUntil < now);
      setOnlineUsers(onlineUsers);
    });
    // returns list of the online users
    return () => unsubscribe();
  }, []);
  return onlineUsers;
};
export default useOnlineUsers;
