import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useEffect, useState } from 'react';


const useUserRoles = () => {
    const [roles, setRoles] = useState([]);
    const user = auth.currentUser;

    useEffect(() => {
        const fetchRoles = async () => {
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setRoles(data.rols || []);
                }

            } catch (error) {
                console.error("Error fetching user roles: ", error);
                setRoles([]);
            }
        };

        fetchRoles();
    }, [user]);

    return roles;
};

export default useUserRoles;
