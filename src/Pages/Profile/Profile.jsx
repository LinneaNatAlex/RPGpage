import styles from './Profile.module.css';
import { useEffect, useState, useContext } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/authContext';


const Profile = () => {
    const [userData, setUserData] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
           try {
               const userDocRef = doc(db, 'users', user.uid);
               const userDoc = await getDoc(userDocRef);
               if (userDoc.exists()) {
                   setUserData(userDoc.data());
               } else {
                   console.log('No such document!');
               }
           } catch (error) {
               console.error('Error fetching user data:', error);
           }
        };

        fetchUserData();
    }, [user]);

    if (!userData) {
        return <div className={styles.loadingContainer}>
            <h2>Loading...</h2>
        </div>;
    }

    return <div className={styles.profileWrapper}>
        <div className={styles.profileContainer}>
            {/* --------------------------- */}
            <div className={styles.imageContainer}>
                <img src={userData.profileImageUrl || '/default-profile.png'} alt='pfpimage' className={styles.profileImage } /> 

            </div>
        </div>
        {/* --------------------------- */}
        <div className={styles.characterDetailsContainer}>
            <h2>Character Details</h2>
            <p><strong>Full Name:</strong></p> {user.displayName}
            <p><strong>Class:</strong></p> {userData.class}
            <p><strong>Age:</strong></p> {userData.Age}
            <p><strong>House:</strong></p> {userData.house}
            <p><strong>Account Created:</strong></p> {userData.createdAt?.toDate().toLocaleDateString()}
            <p><strong>Last Login:</strong></p> {userData.lastLogin?.toDate().toLocaleDateString()}
            <p><strong>Role:</strong></p> {userData.rols.join(', ')}
        </div>
    </div>;
};

export default Profile;
