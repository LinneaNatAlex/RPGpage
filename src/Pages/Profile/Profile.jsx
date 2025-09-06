import styles from "./Profile.module.css";
import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import { auth } from "../../firebaseConfig";
import ProfileTextEditor from "../../Components/ProfileTextEditor/ProfileTextEditor";
import Chat from "../../Components/Chat/Chat";
import FriendsList from "../../Components/FriendsList/FriendsList";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const { user, loading } = useAuth();

  // This uses the auth context to get the current user! teck loding state!

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
    // fetching user date, to display on the profile page
    fetchUserData();
  }, [user, loading]);

  if (loading || !userData) {
    // If the user data is still loading or not available, show a loading state
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }
  // -----------------------------PROFILE CONTENT-----------------------------
  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileContainer}>
        {/* ---------------image container------------ */}
        <div className={styles.imageContainer}>
          {(() => {
            let roleClass = styles.profileImage;
            if (userData.roles?.some((r) => r.toLowerCase() === "headmaster"))
              roleClass += ` ${styles.headmasterAvatar}`;
            else if (userData.roles?.some((r) => r.toLowerCase() === "teacher"))
              roleClass += ` ${styles.teacherAvatar}`;
            else if (
              userData.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
            )
              roleClass += ` ${styles.shadowPatrolAvatar}`;
            else if (userData.roles?.some((r) => r.toLowerCase() === "admin"))
              roleClass += ` ${styles.adminAvatar}`;
            return (
              <img
                src={userData?.profileImageUrl || "/icons/avatar.svg"}
                alt="Image"
                className={roleClass}
              />
            );
          })()}
        </div>
        {/* -------------Character details-------------- */}
        <div className={styles.characterDetailsContainer}>
          <div className={styles.charactinfo}>
            <h2>Character Details</h2>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Full Name:</strong>
              </p>{" "}
              {user.displayName}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Class:</strong>
              </p>{" "}
              {userData.class}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Age:</strong>
              </p>{" "}
              {userData.age}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Magical Race:</strong>
              </p>{" "}
              {userData.race}
            </div>
          </div>
          <div className={styles.charactinfo}>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Account Created:</strong>
              </p>{" "}
              {userData.createdAt?.toDate().toLocaleDateString()}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Last Login:</strong>
              </p>{" "}
              {auth.currentUser.metadata.lastLoginAt
                ? new Date(
                    Number(auth.currentUser.metadata.lastLoginAt)
                  ).toLocaleDateString()
                : "N/A"}
            </div>
            <div className={styles.caracterDetails}>
              <p>
                <strong>Roles</strong>
              </p>{" "}
              {userData.roles?.join(", ")}
            </div>
          </div>
        </div>
      </div>
      {/* -----------------------------PROFILE TEXT----------------------------- */}
      <div className={styles.profileTextContainer}>
        <div className={styles.profileText}>
          <h2>Profile Text</h2>
          <div className={styles.contentContainer}>
            <ProfileTextEditor />
          </div>
        </div>
        {/* -----------------------------CHAT BAR----------------------------- */}
        <div className={styles.chatBar}>
          <div className={styles.chatContainer}>{user && <Chat />}</div>
          <FriendsList profileUid={user.uid} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
