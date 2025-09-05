import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import styles from "./FriendsList.module.css";

// Props: profileUid = uid for profilen som vises
const FriendsList = ({ profileUid }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      const userDoc = await getDoc(doc(db, "users", profileUid));
      if (userDoc.exists()) {
        setProfileData(userDoc.data());
        setFriends(userDoc.data().friends || []);
        setIsFriend(userDoc.data().friends?.includes(user?.uid));
        setFriendRequestSent(userDoc.data().friendRequests?.includes(user?.uid));
      }
    }
    if (profileUid) fetchProfile();
  }, [profileUid, user]);

  async function sendFriendRequest() {
    await updateDoc(doc(db, "users", profileUid), {
      friendRequests: arrayUnion(user.uid),
    });
    setFriendRequestSent(true);
  }

  return (
    <div className={styles.friendsBox}>
      <h3>Friends</h3>
      <div className={styles.friendsList}>
        {friends.length === 0 && <span>No friends yet.</span>}
        {friends.map((friendUid) => (
          <FriendAvatar key={friendUid} uid={friendUid} />
        ))}
      </div>
      {user && user.uid !== profileUid && !isFriend && !friendRequestSent && (
        <button className={styles.addFriendBtn} onClick={sendFriendRequest}>
          + Add Friend
        </button>
      )}
      {friendRequestSent && <span className={styles.requestSent}>Request sent</span>}
      {isFriend && <span className={styles.isFriend}>Already friends</span>}
    </div>
  );
};

// Helper: show avatar and name for friend
const FriendAvatar = ({ uid }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    async function fetch() {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) setData(docSnap.data());
    }
    fetch();
  }, [uid]);
  if (!data) return null;
  return (
    <div className={styles.friendAvatar}>
      <img src={data.profileImageUrl || "/icons/avatar.svg"} alt={data.displayName} />
      <span>{data.displayName}</span>
    </div>
  );
};

export default FriendsList;
