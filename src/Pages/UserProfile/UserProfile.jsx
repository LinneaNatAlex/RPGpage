import { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import styles from "./UserProfile.module.css"; // Assuming you have a CSS module for styling

const UserProfile = () => {
  const { uid } = useParams();
  console.log("UID from params:", uid);

  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        // gets the user document based on the uid from the URL
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userDocData = userDoc.data();
          setUserData(userDocData);
          console.log("Fetched user:", userDocData);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setNotFound(true);
      }
    };

    fetchUserData();
  }, [uid]);
  if (notFound) return <div>User not found</div>;
  if (!userData) return <div>Loading...</div>;

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
            {userData.displayName}
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
            {/*When the accont was mad */}
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
      {userData.profileMode && userData.profileHtml && userData.profileCss ? (
        <iframe
          className={styles.profileIframe}
          srcDoc={`<style> ${userData.profileCss} </style>${userData.profileHtml}`}
          sandbox=""
          height={"100vh"}
          width={"100%"}
        />
      ) : userData.profileMode === "text" && userData.profileText ? (
        <div className={styles.profileTextContainer}>
          <div className={styles.profileText}>
            <h2>Profile Text</h2>
            <p>{userData.profileText}</p>
          </div>
        </div>
      ) : (
        <div>No profile available</div>
      )}
    </div>
  );
};
export default UserProfile;
