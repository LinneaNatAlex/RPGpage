
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import the auth object from your firebaseConfig file
import { useEffect, useState } from 'react';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user)=>{
            if (user) {
                setIsLoggedIn(true);
            }else {
                setIsLoggedIn(false);
            }
        });
        return() => {
            unsubscribe();
        };  
    }, [])


    const handleSignOut = async () => {
        try {

            await signOut(auth);
            navigate('/sign-in');
            console.log("Wizard has left the castle.");  

        } catch (error) {
            console.error("Wizzard is trapped somwhere in the castle", error.message);
            
        }      
    }

    return (
        <nav className={styles.navbar}>
            <NavLink to="/">Hogwart Castel</NavLink>
            <NavLink to="/Profile">Profile</NavLink>
            <NavLink to="/edit-profile">Edit Profile</NavLink>

            {/* Makes the butten only avalible when logged in */}
            {isLoggedIn && ( 
                <button onClick={handleSignOut} className={styles.signOutBtn}>Leave Castle</button>
            )}
           
        </nav>
    );
};

console.log('Navbar component loaded');
export default Navbar;