import { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import styles from "./UserProfile.module.css";
import Chat from "../../Components/Chat/Chat";
import { useAuth } from "../../context/authContext";

const UserProfile = () => {
  const { user } = useAuth();
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
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

    if (uid) fetchUserData();
  }, [uid]);

  if (notFound) return <div>User not found</div>;
  if (!userData) return <div>Loading...</div>;

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        <div className={styles.imageContainer}>
          <img
            src={userData?.profileImageUrl || "/icons/avatar.svg"}
            alt="Image"
            className={styles.profileImage}
          />
        </div>

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
              <strong>House:</strong> {userData.house}
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
          </div>
        </div>
      ) : userData.profileMode === "text" && userData.profileText ? (
        <div className={styles.profileTextContainer}>
          <h2>Profile Text</h2>
          <p>{userData.profileText}</p>
        </div>
      ) : (
        <div>No profile bio available</div>
      )}
    </div>
  );
};

export default UserProfile;
