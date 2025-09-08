// Import necessary libraries and hooks
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import the auth object from your firebaseConfig file
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Import the Firestore database object
import ErrorMessage from "../Components/ErrorMessage/ErrorMessage"; // Import your error message component
import { useAuth } from "../context/authContext";
// --------------------------------------STATE VARIABLES--------------------------------------
// navbar-komponet that shows the difference in navigation based on if user is loged in or not.
const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const { user } = useAuth(); // <-- Endret her

  // ----------------------------------useEFFECT--------------------------
  // fetching information about 'if the user is logged in'
  useEffect(() => {
    if (location.pathname === "/verify-email") {
      return;
    }
    //  checks the changes in login status
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // if user is loged in or not then it updates true or falls
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, [location.pathname]);
  // loading state to show the nav only if the user is logged in.
  if (loading) return null;
  // ---------------------------SIGNOUT HANDLER-----------------------
  const handleSignOut = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // uppdates the Firestore to handle the marked user as ofline
        await updateDoc(doc(db, "users", user.uid), { online: false });
      }
      await signOut(auth);
      navigate("/sign-in");
      // shows error message if there is user has issue logging out. Usaly because of deleted user in the firestore.
    } catch (error) {
      setError(
        "This Wizard is trapped somwhere inside the castle, contact the headmaster!"
      );
    }
  };
  // -----------------------------NAVIGATION BARITEMS-----------------------------
  // Navigation bar based on if the suer is loged in or not
  return (
    <nav className={styles.navbar}>
      {isLoggedIn && user?.emailVerified ? ( // <-- Endret her
        <>
          <div className={styles.menuItems}>
            <NavLink to="/">Veyloria Arcane School</NavLink>
            <NavLink to="/Profile">My Character</NavLink>
            <NavLink to="/userMap">Student Map</NavLink>

            <NavLink to="/shop">Shop</NavLink>

            <div className={styles.dropdown}>
              <span
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#b0aac2",
                }}
              >
                Roleplay
              </span>
              <div className={styles.dropdownContent}>
                <NavLink to="/Rpg/GreatHall">Starshade Hall</NavLink>
                <NavLink to="/forum/commonroom">Commonroom</NavLink>
                <NavLink to="/forum/ritualroom">Ritual Room</NavLink>
                <NavLink to="/forum/moongarden">Moon Garden</NavLink>
                <NavLink to="/forum/bloodbank">Blood Bank</NavLink>
                <NavLink to="/forum/nightlibrary">Night Library</NavLink>
                <NavLink to="/forum/gymnasium">The Gymnasium</NavLink>
                <NavLink to="/forum/infirmary">The Infirmary</NavLink>
                <NavLink to="/forum/greenhouse">The Greenhouse</NavLink>
                <NavLink to="/forum/artstudio">The Art Studio</NavLink>
                <NavLink to="/forum/kitchen">Kitchen</NavLink>
              </div>
            </div>

            <div className={styles.dropdown}>
              <NavLink to="/ClassRooms">Classrooms</NavLink>
              <div className={styles.dropdownContent}>
                <NavLink to="/ClassRooms/Potions">Alchemy & Potions</NavLink>
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
        //Shows if the user is not logged in!
        <>
          <span>Welcome new student!</span>
        </>
      )}
    </nav>
  );
};

export default Navbar;
