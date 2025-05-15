import styles from './MainPage.module.css';
import { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';



const MainPage = () => {
    const [user, setUser] = useState(null);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('User state changed:', currentUser);
        if (currentUser) {
            setUser(currentUser.displayName || currentUser.email);
        } else {
            setUser(null);
        }
    });
    return () => unsubscribe();
}, []);

    
    return <section className={styles.introductionPage}>
        <header className={styles.introductionHeader}>
            <h1 className={styles.introductionTitle}> Welcome {user || 'Guest'} </h1>
            <p className={styles.introductionText}>Welcome to the world of magic and wonder! Join us on an enchanting journey where you can explore the mysteries of the universe, learn powerful spells, and discover the secrets of the magical realm. Whether you're a seasoned wizard or a curious newcomer, there's something for everyone in this magical adventure. So grab your wand and get ready to embark on an unforgettable quest!</p>
       
        {/* to make sure the only see the links if they are not logged in */}
            {!user && (
                <>
                    <Link to='/sign-in' className={styles.ctaBtn}>Enter the Castle</Link>
                    <Link to='/sign-up' className={styles.ctaBtn}>Create an Account</Link>
                </>
            )}
        </header>
    </section>
};

export default MainPage;