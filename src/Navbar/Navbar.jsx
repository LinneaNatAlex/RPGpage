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
import useUserRoles from "../hooks/useUserRoles"; // Import the custom hook for user roles
import useTopicCounts from "../hooks/useTopicCounts";
// --------------------------------------STATE VARIABLES--------------------------------------
// navbar-komponet that shows the difference in navigation based on if user is loged in or not.
const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const { user } = useAuth(); // <-- Endret her
  const { roles } = useUserRoles(); // <-- Get user roles using the custom hook
  const { topicCounts, loading: topicCountsLoading } = useTopicCounts();

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
            <NavLink to="/">Vayloria Arcane School</NavLink>
            <NavLink to="/Profile">My Character</NavLink>
            <NavLink to="/userMap">Student Map</NavLink>
            <NavLink to="/shop">Shop</NavLink>
            <div className={styles.dropdown}>
              <span
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#c4b8a4",
                }}
              >
                Roleplay
              </span>
              <div className={styles.dropdownContent} style={{ zIndex: 10000 }}>
                <NavLink to="/starshade-hall">Starshade Hall</NavLink>
                <NavLink to="/forum/commons">
                  <span>Commons</span>
                  <span>({topicCounts.commons || 0})</span>
                </NavLink>
                <NavLink to="/forum/ritualroom">
                  <span>Ritual Room</span>
                  <span>({topicCounts.ritualroom || 0})</span>
                </NavLink>
                <NavLink to="/forum/moongarden">
                  <span>Moon Garden</span>
                  <span>({topicCounts.moongarden || 0})</span>
                </NavLink>
                <NavLink to="/forum/bloodbank">
                  <span>Blood Bank</span>
                  <span>({topicCounts.bloodbank || 0})</span>
                </NavLink>
                <NavLink to="/forum/nightlibrary">
                  <span>Night Library</span>
                  <span>({topicCounts.nightlibrary || 0})</span>
                </NavLink>
                <NavLink to="/forum/gymnasium">
                  <span>The Gymnasium</span>
                  <span>({topicCounts.gymnasium || 0})</span>
                </NavLink>
                <NavLink to="/forum/infirmary">
                  <span>The Infirmary</span>
                  <span>({topicCounts.infirmary || 0})</span>
                </NavLink>
                <NavLink to="/forum/greenhouse">
                  <span>The Greenhouse</span>
                  <span>({topicCounts.greenhouse || 0})</span>
                </NavLink>
                <NavLink to="/forum/artstudio">
                  <span>The Art Studio</span>
                  <span>({topicCounts.artstudio || 0})</span>
                </NavLink>
                <NavLink to="/forum/kitchen">
                  <span>Kitchen</span>
                  <span>({topicCounts.kitchen || 0})</span>
                </NavLink>
                <NavLink to="/forum/detentionclassroom">
                  <span>Detention Classroom</span>
                  <span>({topicCounts.detentionclassroom || 0})</span>
                </NavLink>
                <NavLink to="/forum/shortbutlong">
                  <span>Short, but long</span>
                  <span>({topicCounts.shortbutlong || 0})</span>
                </NavLink>
                <NavLink to="/forum/18plus">
                  <span>18+ Forum</span>
                  <span>({topicCounts['18plus'] || 0})</span>
                </NavLink>
              </div>
            </div>
            <div className={styles.dropdown}>
              <span
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#c4b8a4",
                }}
              >
                Page Rules
              </span>
              <div className={styles.dropdownContent} style={{ zIndex: 10000 }}>
                <NavLink to="/rules">Rules overview & About</NavLink>
                <NavLink to="/library" className={styles.dropdownLinkLibrary}>Library (tips you should know)</NavLink>
              </div>
            </div>
            <div className={styles.dropdown}>
              <NavLink to="/ClassRooms">Classrooms</NavLink>
              {/* Removed Alchemy & Potions from dropdown */}
            </div>
            {roles.includes("admin") && <NavLink to="/admin">Admin</NavLink>}{" "}
            {(roles.includes("professor") || roles.includes("teacher") || roles.includes("admin") || roles.includes("archivist") || roles.includes("headmaster")) && (
              <NavLink to="/professor">Professor Panel</NavLink>
            )}{" "}
            {/* Shows the Admin link only for admin, Professor Panel for professor/admin */}
            {/* Makes the butten only avalible when logged in */}
            <button onClick={handleSignOut} className={styles.signOutBtn}>
              Exit
            </button>
            {error && <ErrorMessage message={error} />}
          </div>
        </>
      ) : (
        <>
          <div className={styles.menuItems}>
            <NavLink to="/sign-in" className={styles.siteTitle}>
              Vayloria Arcane School
            </NavLink>
            <NavLink to="/sign-in">Sign in</NavLink>
            <NavLink to="/sign-up">Register</NavLink>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
