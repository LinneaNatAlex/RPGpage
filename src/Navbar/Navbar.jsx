import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import the auth object from your firebaseConfig file
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Import the Firestore database object
import ErrorMessage from "../Components/ErrorMessage/ErrorMessage"; // Import your error message component

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  if (location.pathname === "/verify-email") {
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { online: false });
        return;
      }
      await signOut(auth);
      navigate("/sign-in");
      // console.log("Wizard has left the castle.");
    } catch (error) {
      setError(
        "This Wizard is trapped somwhere inside the castle, contact the headmaster!"
      );
    }
  };

  return (
    <nav className={styles.navbar}>
      {isLoggedIn ? (
        <>
          <div className={styles.menuItems}>
            <NavLink to="/">Hogwart Castel</NavLink>
            <NavLink to="/Profile">Profile</NavLink>
            <NavLink to="/userMap">User Map</NavLink>

            <div className={styles.classroomsDropdown}>
              <NavLink to="/ClassRooms">Class Rooms</NavLink>
              <div className={styles.dropdown}>
                <NavLink to="/ClassRooms/Potions">Potions</NavLink>
              </div>
            </div>

            {/* Makes the butten only avalible when logged in */}

            <button onClick={handleSignOut} className={styles.signOutBtn}>
              Exit
            </button>
            {error && <ErrorMessage message={error} />}
          </div>
        </>
      ) : (
        <>
          <span>Welcome new student!</span>
        </>
      )}
    </nav>
  );
};

export default Navbar;
