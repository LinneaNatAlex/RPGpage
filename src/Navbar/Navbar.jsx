import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import the auth object from your firebaseConfig file
import { useEffect, useState } from "react";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      await signOut(auth);
      navigate("/sign-in");
      console.log("Wizard has left the castle.");
    } catch (error) {
      console.error("Wizzard is trapped somwhere in the castle", error.message);
    }
  };

  return (
    <nav className={styles.navbar}>
      {isLoggedIn ? (
        <>
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
            Leave Castle
          </button>
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
