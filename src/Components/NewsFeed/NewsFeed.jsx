import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import styles from "./NewsFeed.module.css";
import useUsers from "../../hooks/useUser";
import Button from "../Button/Button";

const NewsFeed = () => {
  // All the state variables and hooks.
  const [iframeHeights, setIframeHeights] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  // This CHECKS if the user has the role of admin, teacher, or archivist. These roles can post news and delete posts.
  const isAdminOrTeacher =
    !loadingRoles &&
    Array.isArray(userRoles) &&
    (userRoles.includes("admin") ||
      userRoles.includes("teacher") ||
      userRoles.includes("archivist"));

  // USEEFFECT gathering / fetching the news from the database, now filtered and limited
  useEffect(() => {
    if (loading || loadingRoles || !user) return;

    const fetchNews = async () => {
      try {
        // QUOTA OPTIMIZATION: Add limit to reduce Firebase reads
        const q = query(
          collection(db, "news"),
          orderBy("createdAt", "desc"),
          limit(25) // Limit to 25 results to reduce quota usage, then filter to 10
        );

        const snapshot = await getDocs(q);
        const newData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          // Filter by type if not using Firestore 'where' above
          .filter((item) => item.type === "nyhet");
        setNewsList(newData.slice(0, 10));
      } catch (error) {
        console.error("Error fetching news:", error);
        setNewsList([]);
      }
    };

    fetchNews();
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
            else if (
              userObj?.roles?.some((r) => r.toLowerCase() === "archivist")
            )
              nameClass += ` ${styles.archivistName}`;
            return (
              <div key={item.id}>
                <div className={styles.newsContent}>
                  <div className={styles.newsInfo}>
                    <h3>{item.title}</h3>
                    <div className={styles.authorDateInfo}>
                      <span className={nameClass}>{item.author}</span>
                      {item.createdAt && (
                        <span className={styles.postDate}>
                          • {new Date(item.createdAt.toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.content.startsWith("{{code}}") ? (
                    <div className={styles.codePostPreview}>
                      <p className={styles.codePostDescription}>
                        Click to view the latest news
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedPost(item);
                          setModalOpen(true);
                        }}
                        className={styles.viewCodeButton}
                      >
                        View Content
                      </Button>
                    </div>
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

      {/* Popup overlay for HTML/CSS content */}
      {modalOpen && selectedPost && (
        <div
          className={styles.popupOverlay}
          onClick={() => setModalOpen(false)}
        >
          <button
            className={styles.closePopupButton}
            onClick={() => setModalOpen(false)}
          >
            ×
          </button>
          <div
            className={styles.popupContent}
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{
              __html: selectedPost.content
                .replace("{{code}}", "")
                .replace("{{/code}}", ""),
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
