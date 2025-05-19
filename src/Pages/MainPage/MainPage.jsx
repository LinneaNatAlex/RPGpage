import styles from './MainPage.module.css';
import { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import Chat from '../../Components/Chat/Chat';
import NewsFeed from '../../Components/NewsFeed/NewsFeed';
import OnlineUsers from '../../Components/OnlineUsers/OnlineUsers';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Sky from '../../assets/VideoBackgrounds/Sky.mp4';




const MainPage = () => {
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('User state changed:', currentUser);
        // Check if the user is logged in
        if (currentUser) {
            setUser(currentUser.displayName || currentUser.email);

            try{
                await setDoc(doc(db, 'users', currentUser.uid), {
                    displayName: currentUser.displayName || currentUser.email,
                    online: true,
                }, { merge: true });
                console.log("User document updated successfully");
            } catch (error) {
                console.error("Error updating user document: ", error);
            }

        } else {
            setUser(null);
        }

        setAuthChecked(true);
    });

    return () => unsubscribe();
}, []);

    if (!authChecked) {
        return null;
    }

    
    return  <section className={styles.introductionPage}>
           

        <header className={styles.introductionHeader}>
            <h1 className={styles.introductionTitle}> Welcome {user || 'Witch/Wizard'} </h1>
            <p className={styles.introductionText}>
                Your magical journey continues. Check the notice board for updates, attend classes and quests, and keep an eye on your house points. Remember: magic is shaped by the choices you make.
                
                {!user && (
                    <>Are you ready to begin your journey as a witch or wizard? Here you can be sorted into a house, attend magical classes like Potions and Defense Against the Dark Arts, and write your own Hogwarts story. Join a thriving community and experience the magic like never before.</>
                )}
            </p>

        {/* to make sure the only see the links if they are not logged in */}
            {!user && (
                <>
                    <Link to='/sign-in' className={styles.ctaBtn}>Enter the Castle</Link>
                    <Link to='/sign-up' className={styles.ctaBtn}>Create an Account</Link>
                </>
            )}
        </header>
        <main className={styles.mainContentHome}>
            <div className={styles.introductionImageContainer}>
                {(user) && <OnlineUsers />}
            </div>
            <div className={styles.newsFeedContainer}>
               {(user) ? (<NewsFeed /> ) : (<p>Something else will be displayed here</p>)}
            </div>
            <div className={styles.chatContainer}>
                {user && <Chat />}
            </div>
        </main>

    </section>
    
};

export default MainPage;