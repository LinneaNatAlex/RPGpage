import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// this hook is used to get the online users from the db, makin it possible to use it in any part of the app
const useOnlineUsers = () => {
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(()=> {
        const querry = query(collection(db, 'users'), where('online', '==', true));
        const unsubscribe = onSnapshot(querry, (snapshot) => {
            const onlineUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setOnlineUsers(onlineUsers);
        });
        return () => unsubscribe();
    }
    , []);
    return onlineUsers;
}
export default useOnlineUsers;