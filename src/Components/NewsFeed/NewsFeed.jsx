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
import useUsers from "../../hooks/useUser";
import Button from "../Button/Button";

const NewsFeed = () => {
  // All the state variables and hooks.
  const [iframeHeights, setIframeHeights] = useState([]);

  // Listen for messages from iframes to set their height
  useEffect(() => {
    function handleMessage(event) {
      if (
        event.data &&
        event.data.type === "setHeight" &&
        typeof event.data.index === "number"
      ) {
        setIframeHeights((prev) => {
          const next = [...prev];
          next[event.data.index] = event.data.height;
          return next;
        });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Funksjon for å slette en nyhet
  const handleDeletePost = async (id) => {
    const docRef = doc(db, "news", id);
    await deleteDoc(docRef);
  };
  const { users } = useUsers();
  const { user, loading } = useAuth();
  const { roles: userRoles, rolesLoading: loadingRoles } = useUserRoles();
  const [newsList, setNewsList] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [titles, setTitles] = useState("");

  // This CHECKS if the user has the role of admin. If the user is admin then this gives the user the ability to post news, and delete posts.
  const isAdminOrTeacher =
    !loadingRoles &&
    Array.isArray(userRoles) &&
    (userRoles.includes("admin") || userRoles.includes("teacher"));

  // USEEFFECT gathering / fetching the news from the database, now filtered and limited
  useEffect(() => {
    if (loading || loadingRoles || !user) return;

    // Query only 'nyhet' type news, ordered by createdAt, limited to 10
    const q = query(
      collection(db, "news"),
      // Uncomment the next line if you have a 'type' field in your news documents
      // where("type", "==", "nyhet"),
      orderBy("createdAt", "desc")
      // Limit to 10 results for performance
      // limit(10)
    );
    let didCancel = false;
    const unsubscribe = onSnapshot(
      q,
      (Snapshot) => {
        if (didCancel) return;
        const newData = Snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          // Filter by type if not using Firestore 'where' above
          .filter((item) => item.type === "nyhet");
        setNewsList(newData.slice(0, 10));
      },
      (error) => {
        if (!didCancel) {
          setNewsList([]);
          // Optionally, set an error state and display a message
          console.error("Error loading news:", error);
        }
      }
    );
    return () => {
      didCancel = true;
      unsubscribe();
    };
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
      type: "nyhet",
    });
    setTitles("");
    setNewPost("");
  };

  return (
    <div className={styles.newsFeedWrapper}>
      {/* Admin/teacher input for posting news */}
      {isAdminOrTeacher && (
        <div className={styles.newsAdminContainer}>
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
          <Button
            onClick={handlePostSubmit}
            className={styles.handlePostSubmit}
          >
            Post
          </Button>
        </div>
      )}
      <div className={styles.newsContainer}>
        {/* Display for the news post */}
        <>
          {newsList.map((item, idx) => {
            // ...existing code...
            // Finn brukerobjekt for å hente roller
            const userObj = users.find(
              (u) =>
                u.displayName &&
                u.displayName.toLowerCase() === item.author?.toLowerCase()
            );
            let nameClass = styles.posterName;
            if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
              nameClass += ` ${styles.headmasterName}`;
            else if (userObj?.roles?.some((r) => r.toLowerCase() === "teacher"))
              nameClass += ` ${styles.teacherName}`;
            else if (
              userObj?.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
            )
              nameClass += ` ${styles.shadowPatrolName}`;
            else if (userObj?.roles?.some((r) => r.toLowerCase() === "admin"))
              nameClass += ` ${styles.adminName}`;
            return (
              <div key={item.id}>
                <div className={styles.newsContent}>
                  <div className={styles.newsInfo}>
                    <h3>{item.title}</h3>
                    <span className={nameClass}>{item.author}</span>:
                  </div>
                  {item.content.startsWith("{{code}}") ? (
                    <iframe
                      srcDoc={`<body style='margin:0'>${item.content
                        .replace("{{code}}", "")
                        .replace("{{/code}}", "")}
                        <script>
                          function sendHeight() {
                            window.parent.postMessage({type: 'setHeight', height: document.body.scrollHeight, index: ${idx}}, '*');
                          }
                          window.onload = sendHeight;
                          window.addEventListener('resize', sendHeight);
                          setTimeout(sendHeight, 100);
                        <\/script>
                      </body>`}
                      sandbox="allow-same-origin"
                      title="code-preview"
                      frameBorder="0"
                      style={{
                        width: "100%",
                        minHeight: "500px",
                        maxHeight: "1200px",
                        overflowY: "auto",
                        display: "block",
                        padding: "5px",
                        height: iframeHeights[idx]
                          ? iframeHeights[idx] + "px"
                          : "500px",
                      }}
                    />
                  ) : (
                    <div className={styles.textBlock}>
                      <p>{item.content}</p>
                    </div>
                  )}
                </div>
                <br />
                <br />
                {/* Theese buttons is only displayed for the admin role */}
                {isAdminOrTeacher && (
                  <Button
                    onClick={() => handleDeletePost(item.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </Button>
                )}
              </div>
            );
          })}
        </>
      </div>
    </div>
  );
};

export default NewsFeed;
