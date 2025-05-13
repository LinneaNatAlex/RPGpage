import styles from './MainPage.module.css';
import { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';



const MainPage = () => {
    const [user, setUser] = useState(null);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('User state changed:', currentUser);
        if (currentUser) {
            setUser(currentUser.displayName || currentUser.email);
        } else {
            setUser('Guest');
        }
    });
    return () => unsubscribe();
}, []);

    
    return <section className={styles.introductionPage}>
        <header className={styles.introductionHeader}>
            <h1 className={styles.introductionTitle}> Welcome {user || 'Guest'} </h1>
            <p className={styles.introductionText}>Welcome to the world of magic and wonder! Join us on an enchanting journey where you can explore the mysteries of the universe, learn powerful spells, and discover the secrets of the magical realm. Whether you're a seasoned wizard or a curious newcomer, there's something for everyone in this magical adventure. So grab your wand and get ready to embark on an unforgettable quest!</p>
        </header>
    </section>
};

export default MainPage;