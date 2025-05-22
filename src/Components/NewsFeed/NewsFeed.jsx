import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
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
  const [titles, setTitles] = useState("");

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
      title: titles,
      content: newPost,
      createdAt: serverTimestamp(),
      author: user.displayName,
    });
    setTitles("");
    setNewPost("");
  };

  const handleDeletePost = async (id) => {
    const docRef = doc(db, "news", id);
    await deleteDoc(docRef);
  };

  if (loading || loadingRoles) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className={styles.newsFeedWrapper}>
      <div className={styles.newsAdminContainer}>
        <h2>News Feed</h2>
        {isAdmin && (
          <>
            <input
              type="text"
              value={titles}
              onChange={(e) => setTitles(e.target.value)}
              placeholder="Title"
              required
            />
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="news here"
              className={styles.textArea}
              required
            />

            {newPost.startsWith("{{code}}") && (
              // starts with {{code}} will make it show up a live prewiew window of the code. If not it wont show up.
              <div className={styles.prewiewContainer}>
                <h2>Here you can se Live prewiev off your codes</h2>
                <iframe
                  // Using iframe to show live preview of code, this is so its easier to know how the code will looklike before it is posted on the wall!
                  srcDoc={newPost
                    .replace("{{code}}", "")
                    .replace("{{/code}}", "")}
                  sandbox="allow-same-origin"
                  title="code-preview"
                  frameBorder="0"
                  width="100%"
                  height="300px"
                  style={{ border: "1px solid #ccc" }}
                />
              </div>
            )}
            <Button
              onClick={handlePostSubmit}
              className={styles.handlePostSubmit}
            >
              Post
            </Button>
          </>
        )}
      </div>

      <div className={styles.newsContainer}>
        {newsList.map((item) => (
          <div key={item.id}>
            <h3>{item.title}</h3>
            <strong>{item.author}</strong>:{" "}
            {item.content.startsWith("{{code}}") ? (
              <iframe
                // SrcDoc is used to show the html/css styling inside the Iframe.
                srcDoc={item.content
                  .replace("{{code}}", "")
                  .replace("{{/code}}", "")}
                sandbox="allow-same-origin"
                title="code-preview"
                frameBorder="0"
                // Size is defined so that the iframe can be shown correctly. So the reason is because, even if '' srcDoc '' can show the visual html/css styling it can not change the Iframe size.
                width="100%"
                height="300px"
              />
            ) : (
              <p>{item.content}</p>
            )}{" "}
            <br />
            <br />
            {isAdmin && (
              <Button
                onClick={() => handleDeletePost(item.id)}
                className={styles.deleteButton}
              >
                Delete
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
