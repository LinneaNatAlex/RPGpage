// import the necessary libraries and components
import { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import styles from "./UserProfile.module.css";
import Chat from "../../Components/Chat/Chat";
import FriendsList from "../../Components/FriendsList/FriendsList";
import { useAuth } from "../../context/authContext";

// state variables and hooks to manage user profile data
const UserProfile = () => {
  const { user } = useAuth();
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  //  ----------------------------------useEffect----------------------------------
  useEffect(() => {
    // function to fetch user data based on rout parameter 'uid'
    const fetchUserData = async () => {
      try {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          setUserData(data);
          console.log("Fetched user:", data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setNotFound(true);
      }
    };
    // fetching the user data if it is avalible

    if (uid) fetchUserData();
  }, [uid]);

  if (notFound) return <div>User not found</div>;
  if (!userData) return <div>Loading...</div>;
  // ----------------------------------PROFILE CONTENT----------------------------------
  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        <div className={styles.imageContainer}>
          {/* image container */}
          <img
            src={userData?.profileImageUrl || "/icons/avatar.svg"}
            alt="Image"
            className={
              userData.roles && userData.roles.includes("admin")
                ? `${styles.profileImage} ${styles.adminAvatar}`
                : styles.profileImage
            }
          />
        </div>
        {/* --------------------------------CHARACTER DETAILS-------------------------------- */}
        <div className={styles.characterDetailsContainer}>
          <div className={styles.charactinfo}>
            <h2>Character Details</h2>
            <p>
              <strong>Full Name:</strong> {userData.displayName}
            </p>
            <p>
              <strong>Class:</strong> {userData.class}
            </p>
            <p>
              <strong>Age:</strong> {userData.age}
            </p>
            <p>
              <strong>Magical Race:</strong> {userData.race}
            </p>
          </div>

          <div className={styles.charactinfo}>
            <p>
              <strong>Account Created:</strong>
              {userData.createdAt && userData.createdAt.toDate
                ? userData.createdAt.toDate().toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Last Login:</strong>
              {auth.currentUser?.metadata?.lastLoginAt
                ? new Date(
                    Number(auth.currentUser.metadata.lastLoginAt)
                  ).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Roles:</strong> {userData.roles?.join(", ")}
            </p>
          </div>
        </div>
      </div>
      {/* -----------------------------PROFILE BIO----------------------------- */}
      {/* BIO: HTML eller tekst */}
      {userData.profileMode === "html" &&
      userData.profileHtml &&
      userData.profileCss ? (
        <div className={styles.profileHtmlContainer}>
          <iframe
            className={styles.profileIframe}
            srcDoc={`<style>${userData.profileCss}</style>${userData.profileHtml}`}
            sandbox=""
            height="100vh"
            width="100%"
          />
          <div className={styles.chatBar}>
            <div className={styles.chatContainer}>{user && <Chat />}</div>
            <FriendsList profileUid={uid} />
          </div>
        </div>
      ) : userData.profileMode === "text" && userData.profileText ? (
        <div className={styles.profileTextContainer}>
          <h2>Profile Text</h2>
          <p>{userData.profileText}</p>
        </div>
      ) : (
        // IF USER HASN NO BIO
        <div>No profile bio available</div>
      )}
    </div>
  );
};

export default UserProfile;
