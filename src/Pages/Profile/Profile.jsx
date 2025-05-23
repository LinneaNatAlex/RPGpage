import styles from "./Profile.module.css";
import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import { auth } from "../../firebaseConfig";
import ProfileTextEditor from "../../Components/ProfileTextEditor/ProfileTextEditor";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user, loading]);

  if (loading || !userData) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        {/* --------------------------- */}
        <div className={styles.imageContainer}>
          <img
            src={userData?.profileImageUrl || "/icons/avatar.svg"}
            alt="Image"
            className={styles.profileImage}
          />
        </div>
        {/* --------------------------- */}
        <div className={styles.characterDetailsContainer}>
          <div className={styles.charactinfo}>
            <h2>Character Details</h2>
            <p>
              <strong>Full Name:</strong>
            </p>{" "}
            {user.displayName}
            <p>
              <strong>Class:</strong>
            </p>{" "}
            {userData.class}
            <p>
              <strong>Age:</strong>
            </p>{" "}
            {userData.age}
            <p>
              <strong>House:</strong>
            </p>{" "}
            {userData.house}
          </div>
          <div className={styles.charactinfo}>
            <p>
              <strong>Account Created:</strong>
            </p>{" "}
            {userData.createdAt?.toDate().toLocaleDateString()}
            <p>
              <strong>Last Login:</strong>
            </p>{" "}
            {auth.currentUser.metadata.lastLoginAt
              ? new Date(
                  Number(auth.currentUser.metadata.lastLoginAt)
                ).toLocaleDateString()
              : "N/A"}
            <p>
              <strong>Roles</strong>
            </p>{" "}
            {userData.roles?.join(", ")}
          </div>
        </div>
      </div>
      <div className={styles.profileTextContainer}>
        <div className={styles.profileText}>
          <h2>Profile Text</h2>
          <ProfileTextEditor />
        </div>
      </div>
    </div>
  );
};

export default Profile;
