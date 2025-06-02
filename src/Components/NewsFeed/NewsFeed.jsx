// Imorting necessary libraries and components
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
  // All the state variables andd hooks.
  const { user, loading } = useAuth();
  const { roles: userRoles, rolesLoading: loadingRoles } = useUserRoles();
  const [newsList, setNewsList] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [titles, setTitles] = useState("");

  // This CHECKS if the user has the role of admin. If the user is admin then this gives the user the ability to post news, and delete posts.
  const isAdmin =
    !loadingRoles && Array.isArray(userRoles) && userRoles.includes("admin");

  // USEEFFECT gathering / fetching the neews from the database
  useEffect(() => {
    if (loading || loadingRoles || !user) return;

    // To get the news form the db and makes sure its ordered the createdAt field in /descending/ order.
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

  // HANDLE POST SUBMIT is the function that handles the submission of the news post.
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
  //  HANDLE DELETE POST is function handeling the deliton of the post.
  const handleDeletePost = async (id) => {
    const docRef = doc(db, "news", id);
    await deleteDoc(docRef);
  };
  // Shows the loading screen while the data form the db is loading
  if (loading || loadingRoles) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }
  // This is where what the admin will be seing when they are logged in.
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

            {/* This is where the live preview will be shown, IF ONLY IF the post contains code that starts with {{code}} and ends with {{/code}} */}
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
                  // FRAME BORDER is to remove the border around the Iframe, and making it look more part of the page.
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
        {/* Display for the news post */}

        {newsList.map((item) => (
          <div key={item.id}>
            <div className={styles.newsContent}>
              <div className={styles.newsInfo}>
                {" "}
                <h3>{item.title}</h3>
                <strong>{item.author}</strong>:{" "}
              </div>
              {item.content.startsWith("{{code}}") ? (
                <iframe
                  // SrcDoc is used to show the html/css styling inside the Iframe.
                  srcDoc={item.content
                    .replace("{{code}}", "")
                    .replace("{{/code}}", "")}
                  sandbox="allow-same-origin"
                  title="code-preview"
                  // FRAME BORDER is to remove the border around the Iframe, and making it look more part of the page.
                  frameBorder="0"
                  // Size is defined so that the iframe can be shown correctly. So the reason is because, even if '' srcDoc '' can show the visual html/css styling it can not change the Iframe size.
                />
              ) : (
                <div className={styles.textBlock}>
                  <p>{item.content}</p>
                </div>
              )}{" "}
            </div>
            <br />
            <br />
            {/* Theese buttons is only displayed for the admin role */}
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
