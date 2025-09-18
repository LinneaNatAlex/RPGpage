// Delete entire topic (and all its posts)
const handleDeleteTopic = async () => {
  if (!selectedTopic) return;
  // Delete all posts in the topic first
  const postsRef = collection(
    db,
    `forums/${forumRoom}/topics/${selectedTopic}/posts`
  );
  const postsSnap = (await postsRef.get)
    ? await postsRef.get()
    : await import("firebase/firestore").then((fb) => fb.getDocs(postsRef));
  const docs = postsSnap.docs || postsSnap._docs || [];
  for (const postDoc of docs) {
    await deleteDoc(postDoc.ref);
  }
  // Delete the topic itself
  await deleteDoc(doc(db, `forums/${forumRoom}/topics`, selectedTopic));
  setSelectedTopic(null);
};
import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import useUsers from "../../hooks/useUser";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Forum.module.css";
import Button from "../../Components/Button/Button";
import { countWords, checkWordCountReward, updateUserWordCount } from "../../utils/wordCountReward";

// Rich text editor (install react-quill if not present)
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const forumNames = {
  commonroom: "Commonroom",
  ritualroom: "Ritual Room",
  moongarden: "Moon Garden",
  bloodbank: "Blood Bank",
  nightlibrary: "Night Library",
  gymnasium: "The Gymnasium",
  infirmary: "The Infirmary",
  greenhouse: "The Greenhouse",
  artstudio: "The Art Studio",
  kitchen: "Kitchen",
};

const raceCommonrooms = {
  elf: "Elf Commonroom",
  witch: "Witch Commonroom",
  vampire: "Vampire Commonroom",
  werewolf: "Werewolf Commonroom",
};

const Forum = () => {
  const { user, loading } = useAuth();
  const { users } = useUsers();
  const { roles, rolesLoading } = useUserRoles();
  // Topic/forum state
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const POSTS_PER_PAGE = 10;
  // New topic state
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicWordCount, setNewTopicWordCount] = useState(0);
  // New post state (reply)
  const [replyContent, setReplyContent] = useState("");
  const [replyWordCount, setReplyWordCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [nitsReward, setNitsReward] = useState(null);
  const navigate = useNavigate();

  // Hent forumId fra URL
  const { forumId } = useParams();
  let forumRoom = forumId;
  let forumTitle = forumNames[forumId] || "Forum";

  // Hvis commonroom: bruk rasebasert commonroom hvis mulig
  if (forumId === "commonroom" && user && user.race) {
    const raceKey = user.race.toLowerCase();
    if (raceCommonrooms[raceKey]) {
      forumRoom = raceKey + "_commonroom";
      forumTitle = raceCommonrooms[raceKey];
    }
  }

  // Redirect hvis ikke logget inn
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  // Fetch forum posts for this room
  // Fetch topics for this forum room
  useEffect(() => {
    if (!forumRoom) return;
    const q = query(
      collection(db, `forums/${forumRoom}/topics`),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTopics(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [forumRoom]);

  // Fetch posts for selected topic
  useEffect(() => {
    if (!forumRoom || !selectedTopic) return;
    const q = query(
      collection(db, `forums/${forumRoom}/topics/${selectedTopic}/posts`),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setPostPage(1); // Reset to first page when topic changes
    });
    return () => unsub();
  }, [forumRoom, selectedTopic]);

  // Post new thread
  // Utility for empty content
  const isContentEmpty = (html) => {
    const text = html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();
    return !text;
  };

  // Create new topic
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || isContentEmpty(newTopicContent)) return;
    
    const wordCount = countWords(newTopicContent);
    
    const topicRef = await addDoc(
      collection(db, `forums/${forumRoom}/topics`),
      {
        title: newTopicTitle,
        author: user.displayName,
        createdAt: serverTimestamp(),
        uid: user.uid,
      }
    );
    await addDoc(
      collection(db, `forums/${forumRoom}/topics/${topicRef.id}/posts`),
      {
        content: newTopicContent,
        author: user.displayName,
        createdAt: serverTimestamp(),
        uid: user.uid,
      }
    );
    
    // Update user's total word count and check for nits reward
    const newTotalWordCount = await updateUserWordCount(user.uid, wordCount);
    const reward = await checkWordCountReward(user.uid, newTotalWordCount, newTotalWordCount - wordCount);
    
    if (reward.awarded) {
      setNitsReward(`You earned ${reward.nits} nits for writing ${wordCount} words!`);
      setTimeout(() => setNitsReward(null), 10000);
    }
    
    setNewTopicTitle("");
    setNewTopicContent("");
    setNewTopicWordCount(0);
    setSelectedTopic(topicRef.id);
  };

  // Delete entire topic (and all its posts)
  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;
    // Delete all posts in the topic first
    const postsRef = collection(
      db,
      `forums/${forumRoom}/topics/${selectedTopic}/posts`
    );
    const postsSnap = await getDocs(postsRef);
    for (const postDoc of postsSnap.docs) {
      await deleteDoc(postDoc.ref);
    }
    // Delete the topic itself
    await deleteDoc(doc(db, `forums/${forumRoom}/topics`, selectedTopic));
    setSelectedTopic(null);
  };
  const [editingTopic, setEditingTopic] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editTopicContent, setEditTopicContent] = useState("");

  // Load topic and first post for editing
  const handleEditTopic = () => {
    const topic = topics.find((t) => t.id === selectedTopic);
    setEditTopicTitle(topic?.title || "");
    // Find first post (should be the oldest)
    const firstPost =
      posts.length > 0
        ? [...posts].sort(
            (a, b) => a.createdAt?.seconds - b.createdAt?.seconds
          )[0]
        : null;
    setEditTopicContent(firstPost?.content || "");
    setEditingTopic(true);
  };

  // Save topic edit
  const handleSaveTopicEdit = async () => {
    // Update topic title
    await updateDoc(doc(db, `forums/${forumRoom}/topics`, selectedTopic), {
      title: editTopicTitle,
    });
    // Update first post content
    // Find first post (should be the oldest)
    const firstPost =
      posts.length > 0
        ? [...posts].sort(
            (a, b) => a.createdAt?.seconds - b.createdAt?.seconds
          )[0]
        : null;
    if (firstPost) {
      await updateDoc(
        doc(
          db,
          `forums/${forumRoom}/topics/${selectedTopic}/posts`,
          firstPost.id
        ),
        {
          content: editTopicContent,
        }
      );
    }
    setEditingTopic(false);
  };

  // Post reply in topic
  const handleReply = async () => {
    if (!selectedTopic || isContentEmpty(replyContent)) return;
    
    const wordCount = countWords(replyContent);
    
    await addDoc(
      collection(db, `forums/${forumRoom}/topics/${selectedTopic}/posts`),
      {
        content: replyContent,
        author: user.displayName,
        createdAt: serverTimestamp(),
        uid: user.uid,
      }
    );
    
    // Update user's total word count and check for nits reward
    const newTotalWordCount = await updateUserWordCount(user.uid, wordCount);
    const reward = await checkWordCountReward(user.uid, newTotalWordCount, newTotalWordCount - wordCount);
    
    if (reward.awarded) {
      setNitsReward(`You earned ${reward.nits} nits for writing ${wordCount} words!`);
      setTimeout(() => setNitsReward(null), 10000);
    }
    
    setReplyContent("");
    setReplyWordCount(0);
  };

  // Edit post (correct Firestore path)
  const handleEdit = async (id) => {
    if (!selectedTopic) return;
    await updateDoc(
      doc(db, `forums/${forumRoom}/topics/${selectedTopic}/posts`, id),
      {
        content: editContent,
      }
    );
    setEditingId(null);
    setEditContent("");
  };

  // Delete post (correct Firestore path)
  const handleDelete = async (id) => {
    if (!selectedTopic) return;
    await deleteDoc(
      doc(db, `forums/${forumRoom}/topics/${selectedTopic}/posts`, id)
    );
  };

  // Role color logic (reuse from chat/news)
  const getNameClass = (author) => {
    const userObj = users.find(
      (u) => u.displayName?.toLowerCase() === author?.toLowerCase()
    );
    let nameClass = styles.posterName;
    if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
      nameClass += ` ${styles.headmasterName}`;
    else if (userObj?.roles?.some((r) => r.toLowerCase() === "teacher"))
      nameClass += ` ${styles.teacherName}`;
    else if (userObj?.roles?.some((r) => r.toLowerCase() === "shadowpatrol"))
      nameClass += ` ${styles.shadowPatrolName}`;
    else if (userObj?.roles?.some((r) => r.toLowerCase() === "admin"))
      nameClass += ` ${styles.adminName}`;
    return nameClass;
  };

  return (
    <div className={styles.forumWrapper}>
      <h2>{forumTitle}</h2>
      {nitsReward && (
        <div style={{
          background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
          color: "#F5EFE0",
          padding: "20px 30px",
          borderRadius: "16px",
          marginBottom: "25px",
          border: "3px solid #D4C4A8",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
          fontWeight: 700,
          fontSize: "1.3rem",
          position: "relative",
          animation: "pulse 2s infinite"
        }}>
          {nitsReward}
          <button
            onClick={() => setNitsReward(null)}
            style={{
              position: "absolute",
              top: "8px",
              right: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "#F5EFE0",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Topic list view */}
      {!selectedTopic && (
        <>
          <div className={styles.newTopicForm}>
            <input
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="New topic title"
              className={styles.newTopicInput}
            />
            <ReactQuill
              value={newTopicContent}
              onChange={(val) => {
                setNewTopicContent(val);
                const wordCount = countWords(val);
                setNewTopicWordCount(wordCount);
              }}
              className={styles.newTopicEditor}
            />
            <div
              style={{
                color: newTopicWordCount < 300 ? "#ff6b6b" : "#ffd86b",
                margin: "8px 0 12px 0",
                fontWeight: 600,
              }}
            >
              {`Ord: ${newTopicWordCount} / 300`}
              {newTopicWordCount < 300 && " (minimum 300 ord for å poste)"}
              <div style={{ fontSize: "0.8rem", color: "#8B7A6B", marginTop: "4px" }}>
                Earn 10 nits for every 500 words written!
              </div>
            </div>
            <Button
              onClick={handleCreateTopic}
              className={`${styles.postButton} ${styles.newTopicButton}`}
              disabled={
                !newTopicTitle.trim() ||
                isContentEmpty(newTopicContent) ||
                newTopicWordCount < 300
              }
            >
              Create topic
            </Button>
          </div>
          <div className={styles.topicsList}>
            <h3>Topics</h3>
            {topics.length === 0 && <div>No topics yet.</div>}
            {topics.map((topic) => {
              let createdAtStr = "";
              if (topic.createdAt && topic.createdAt.toDate) {
                const d = topic.createdAt.toDate();
                createdAtStr =
                  d.toLocaleDateString() +
                  " " +
                  d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
              }
              return (
                <div key={topic.id} className={styles.topicBox}>
                  <button
                    className={styles.topicLinkButton}
                    onClick={() => setSelectedTopic(topic.id)}
                    type="button"
                  >
                    <span className={styles.topicTitle}>{topic.title}</span>
                    <span className={styles.topicAuthor}>
                      by {topic.author}
                    </span>
                    {createdAtStr && (
                      <span className={styles.topicTime}>{createdAtStr}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
      {/* Topic view (posts in topic) */}
      {selectedTopic && (
        <div className={styles.topicView}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.2rem",
            }}
          >
            <Button
              onClick={() => setSelectedTopic(null)}
              className={styles.backButton}
            >
              Back to topics
            </Button>
            {(roles?.includes("teacher") || roles?.includes("admin")) && (
              <>
                <Button onClick={handleEditTopic} className={styles.editButton}>
                  Edit Topic
                </Button>
                <Button
                  onClick={handleDeleteTopic}
                  className={styles.deleteButton}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Delete Topic
                </Button>
              </>
            )}
          </div>
          {editingTopic && (
            <div
              style={{
                background: "#23232b",
                borderRadius: 8,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <input
                value={editTopicTitle}
                onChange={(e) => setEditTopicTitle(e.target.value)}
                className={styles.titleInput}
                style={{ marginBottom: 16, width: "100%" }}
                placeholder="Edit topic title"
              />
              <ReactQuill
                value={editTopicContent}
                onChange={setEditTopicContent}
                className={styles.quill}
              />
              <div style={{ marginTop: 16 }}>
                <Button
                  onClick={handleSaveTopicEdit}
                  className={styles.saveButton}
                >
                  Save
                </Button>
                <Button
                  onClick={() => setEditingTopic(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div className={styles.postsList}>
            {[...posts]
              .reverse()
              .slice((postPage - 1) * POSTS_PER_PAGE, postPage * POSTS_PER_PAGE)
              .map((post) => (
                <div key={post.id} className={styles.postBox}>
                  <div className={styles.postHeader}>
                    <span className={getNameClass(post.author)}>
                      {post.author}
                    </span>
                    {(post.uid === user.uid ||
                      roles?.includes("teacher") ||
                      roles?.includes("admin")) && (
                      <>
                        <Button
                          onClick={() => {
                            setEditingId(post.id);
                            setEditContent(post.content);
                          }}
                          className={styles.editButton}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(post.id)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                  {editingId === post.id ? (
                    <>
                      <ReactQuill
                        value={editContent}
                        onChange={setEditContent}
                        className={styles.quill}
                      />
                      <Button
                        onClick={() => handleEdit(post.id)}
                        className={styles.saveButton}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <div
                      className={styles.postContent}
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  )}
                </div>
              ))}
          </div>
          {/* Pagination controls */}
          {posts.length > POSTS_PER_PAGE && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                margin: "1.5rem 0",
              }}
            >
              <Button
                onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                className={styles.postButton}
                disabled={postPage === 1}
              >
                Previous
              </Button>
              <span style={{ color: "#b0aac2", alignSelf: "center" }}>
                Page {postPage} of {Math.ceil(posts.length / POSTS_PER_PAGE)}
              </span>
              <Button
                onClick={() =>
                  setPostPage((p) =>
                    Math.min(Math.ceil(posts.length / POSTS_PER_PAGE), p + 1)
                  )
                }
                className={styles.postButton}
                disabled={postPage === Math.ceil(posts.length / POSTS_PER_PAGE)}
              >
                Next
              </Button>
            </div>
          )}
          {/* Reply box */}
          <div className={styles.replyBox}>
            <ReactQuill
              value={replyContent}
              onChange={(val) => {
                setReplyContent(val);
                const wordCount = countWords(val);
                setReplyWordCount(wordCount);
              }}
              className={styles.quill}
            />
            <div
              style={{
                color: replyWordCount < 300 ? "#ff6b6b" : "#ffd86b",
                margin: "8px 0 12px 0",
                fontWeight: 600,
              }}
            >
              {`Ord: ${replyWordCount} / 300`}
              {replyWordCount < 300 && " (minimum 300 ord for å poste)"}
              <div style={{ fontSize: "0.8rem", color: "#8B7A6B", marginTop: "4px" }}>
                Earn 10 nits for every 500 words written!
              </div>
            </div>
            <Button
              onClick={handleReply}
              className={styles.postButton}
              disabled={isContentEmpty(replyContent) || replyWordCount < 300}
            >
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
