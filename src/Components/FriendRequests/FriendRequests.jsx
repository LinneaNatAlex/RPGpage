import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import styles from "./FriendRequests.module.css";

const FriendRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setRequests(userDoc.data().friendRequests || []);
      }
      setLoading(false);
    }
    fetchRequests();
  }, [user]);

  async function acceptRequest(requestUid) {
    await updateDoc(doc(db, "users", user.uid), {
      friends: arrayUnion(requestUid),
      friendRequests: arrayRemove(requestUid),
    });
    await updateDoc(doc(db, "users", requestUid), {
      friends: arrayUnion(user.uid),
    });
    setRequests((prev) => prev.filter((uid) => uid !== requestUid));
  }

  async function declineRequest(requestUid) {
    await updateDoc(doc(db, "users", user.uid), {
      friendRequests: arrayRemove(requestUid),
    });
    setRequests((prev) => prev.filter((uid) => uid !== requestUid));
  }

  if (loading) return <div>Loading friend requests...</div>;
  if (!requests.length) return <div className={styles.noRequests}>No friend requests</div>;

  return (
    <div className={styles.requestsBox}>
      <h3>Friend Requests</h3>
      <ul className={styles.requestsList}>
        {requests.map((uid) => (
          <li key={uid} className={styles.requestItem}>
            <FriendAvatar uid={uid} />
            <button className={styles.acceptBtn} onClick={() => acceptRequest(uid)}>Accept</button>
            <button className={styles.declineBtn} onClick={() => declineRequest(uid)}>Decline</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

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
    <span style={{ marginRight: "1rem" }}>
      <img src={data.profileImageUrl || "/icons/avatar.svg"} alt={data.displayName} style={{ width: 32, height: 32, borderRadius: "50%", verticalAlign: "middle", marginRight: 6 }} />
      {data.displayName}
    </span>
  );
};

export default FriendRequests;
