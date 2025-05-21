import { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/authContext';

const useUserRoles = () => {
    const { user } = useAuth();
    const [userRoles, setUserRoles] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=> {
        const fetchUserRoles = async () => {
            if (!user) {
                setUserRoles(null);
                setLoading(false);
                return;
            }
            try {
                console.log('user', user.uid);
                
                const userDoc = await getDoc(doc(db, 'users', user.uid));

                if (userDoc.exists()) {
                    setUserRoles(userDoc.data().roles || ['admin']);
                } else {
                    setUserRoles([]);
                }
            } catch (error) {
                console.error('Error fetching user roles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRoles();
    }, [user]);
    return { userRoles, loading };
};

export default useUserRoles;
