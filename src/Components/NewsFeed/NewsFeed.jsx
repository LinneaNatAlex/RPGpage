import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import styles from "./NewsFeed.module.css";
import Button from "../Button/Button";

const NewsFeed = () => {
  const { user, loading } = useAuth();
  const { roles: userRoles, rolesLoading: loadingRoles } = useUserRoles();
  const [newsList, setNewsList] = useState([]);
  const [newPost, setNewPost] = useState("");

  const isAdmin =
    !loadingRoles && Array.isArray(userRoles) && userRoles.includes("admin");

  useEffect(() => {
    if (loading || loadingRoles || !user) return;

    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (Snapshot) => {
      const newData = Snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNewsList(newData);
    });

    return () => unsubscribe();
  }, [user, loading, loadingRoles]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    await addDoc(collection(db, "news"), {
      content: newPost,
      createdAt: serverTimestamp(),
      author: user.displayName,
    });
    setNewPost("");
  };

  if (loading || loadingRoles) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.newsFeedContainer}>
        <h2>News Feed</h2>
        {isAdmin && (
          <>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="news here"
            />
            <Button onClick={handlePostSubmit}>Post</Button>
          </>
        )}
      </div>

      <ul>
        {newsList.map((item) => (
          <li key={item.id}>
            <h3>{item.title}</h3>
            <strong>{item.displayName}</strong>: {item.content} <br />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsFeed;
