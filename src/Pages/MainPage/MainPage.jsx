import styles from './MainPage.module.css';
import { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import Chat from '../../Components/Chat/Chat';




const MainPage = () => {
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('User state changed:', currentUser);
        if (currentUser) {
            setUser(currentUser.displayName || currentUser.email);
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

    
    return <section className={styles.introductionPage}>
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
            <div className={styles.chatContainer}>
                <Chat />
            </div>
        </main>

    </section>
    
};

export default MainPage;