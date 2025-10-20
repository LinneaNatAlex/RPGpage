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
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Forum.module.css";
import Button from "../../Components/Button/Button";
import {
  countWords,
  checkWordCountReward,
  updateUserWordCount,
} from "../../utils/wordCountReward";

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
  detentionclassroom: "Detention Classroom",
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
  const [followedTopics, setFollowedTopics] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [selectedTopicFollowers, setSelectedTopicFollowers] = useState([]);
  const [followerCounts, setFollowerCounts] = useState({});
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
  const fetchTopics = async () => {
    if (!forumRoom) return;
    try {
      const q = query(
        collection(db, `forums/${forumRoom}/topics`),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setTopics(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [forumRoom]);

  // Fetch follower counts when topics change
  useEffect(() => {
    if (topics.length > 0) {
      fetchFollowerCounts();
    }
  }, [topics]);

  // Handle URL parameter to open specific topic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('topic');
    if (topicId) {
      setSelectedTopic(topicId);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch user's followed topics
  const fetchFollowedTopics = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const topics = userData.followedTopics || [];
        setFollowedTopics(topics);
      }
    } catch (error) {
      console.error("Error fetching followed topics:", error);
    }
  };

  useEffect(() => {
    fetchFollowedTopics();
  }, [user]);

  // Fetch follower counts for all topics
  const fetchFollowerCounts = async () => {
    if (!topics.length) return;
    
    try {
      const counts = {};
      const usersRef = collection(db, 'users');
      const allUsersSnapshot = await getDocs(usersRef);
      
      for (const topic of topics) {
        let followerCount = 0;
        
        allUsersSnapshot.forEach(doc => {
          const userData = doc.data();
          const userFollowedTopics = userData.followedTopics || [];
          const isFollowing = userFollowedTopics.some(t => t.id === topic.id);
          if (isFollowing) {
            followerCount++;
          }
        });
        
        counts[topic.id] = followerCount;
      }
      
      setFollowerCounts(counts);
      console.log("Follower counts updated:", counts);
    } catch (error) {
      console.error("Error fetching follower counts:", error);
    }
  };

  // Fetch followers for a specific topic
  const fetchTopicFollowers = async (topicId) => {
    try {
      console.log(`Fetching followers for topic: ${topicId}`);
      const usersRef = collection(db, 'users');
      const allUsersSnapshot = await getDocs(usersRef);
      const followers = [];
      
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userFollowedTopics = userData.followedTopics || [];
        const isFollowing = userFollowedTopics.some(t => t.id === topicId);
        
        if (isFollowing) {
          followers.push({
            id: doc.id,
            displayName: userData.displayName,
            photoURL: userData.photoURL || userData.profileImageUrl,
            roles: userData.roles || []
          });
          console.log(`Found follower: ${userData.displayName}`);
        }
      });
      
      console.log(`Total followers found: ${followers.length}`);
      setSelectedTopicFollowers(followers);
      setShowFollowersModal(true);
    } catch (error) {
      console.error("Error fetching topic followers:", error);
    }
  };

  // Follow/Unfollow topic
  const handleFollowTopic = async (topicId, topicTitle) => {
    if (!user) return;
    
    try {
      console.log("Follow topic clicked:", topicId, topicTitle);
      console.log("Current followedTopics:", followedTopics);
      const userRef = doc(db, 'users', user.uid);
      const isFollowing = followedTopics.some(t => t.id === topicId);
      console.log("Is currently following:", isFollowing);
      
      let updatedFollowedTopics;
      if (isFollowing) {
        // Unfollow
        updatedFollowedTopics = followedTopics.filter(t => t.id !== topicId);
        console.log("Unfollowing topic, new list:", updatedFollowedTopics);
      } else {
        // Follow
        const newTopic = {
          id: topicId,
          title: topicTitle,
          forum: forumTitle,
          followedAt: new Date().toISOString()
        };
        updatedFollowedTopics = [...followedTopics, newTopic];
        console.log("Following topic, new list:", updatedFollowedTopics);
      }
      
      // Update database first
      console.log("Updating database with:", updatedFollowedTopics);
      await updateDoc(userRef, {
        followedTopics: updatedFollowedTopics
      });
      
      // Then update state
      setFollowedTopics(updatedFollowedTopics);
      
      // Refresh follower counts after following/unfollowing
      setTimeout(() => {
        fetchFollowerCounts();
      }, 1000);
      
      console.log("Updated followed topics:", updatedFollowedTopics);
      
    } catch (error) {
      console.error("Error updating followed topics:", error);
      alert("Error updating followed topics: " + error.message);
    }
  };

  // Fetch posts for selected topic
  const fetchPosts = async () => {
    if (!forumRoom || !selectedTopic) return;
    try {
      const q = query(
        collection(db, `forums/${forumRoom}/topics/${selectedTopic}/posts`),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setPostPage(1); // Reset to first page when topic changes
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
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
    const reward = await checkWordCountReward(
      user.uid,
      newTotalWordCount,
      newTotalWordCount - wordCount
    );

    // Reward system still works, but no popup message
    // if (reward.awarded) {
    //   setNitsReward(`You earned ${reward.nits} nits for writing ${wordCount} words!`);
    //   setTimeout(() => setNitsReward(null), 10000);
    // }

    // Automatically follow the topic you just created
    try {
      const isAlreadyFollowing = followedTopics.some(t => t.id === topicRef.id);
      if (!isAlreadyFollowing) {
        await handleFollowTopic(topicRef.id, newTopicTitle);
        console.log("Auto-followed new topic:", topicRef.id);
      }
    } catch (error) {
      console.error("Error auto-following topic:", error);
    }

    setNewTopicTitle("");
    setNewTopicContent("");
    setNewTopicWordCount(0);
    setSelectedTopic(topicRef.id);

    // Refresh topics list
    await fetchTopics();
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

    // Refresh topics list
    await fetchTopics();
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

    // Refresh both topics and posts
    await fetchTopics();
    await fetchPosts();
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
    const reward = await checkWordCountReward(
      user.uid,
      newTotalWordCount,
      newTotalWordCount - wordCount
    );

    // Reward system still works, but no popup message
    // if (reward.awarded) {
    //   setNitsReward(`You earned ${reward.nits} nits for writing ${wordCount} words!`);
    //   setTimeout(() => setNitsReward(null), 10000);
    // }

    // Automatically follow the topic you just replied to
    try {
      const currentTopic = topics.find(t => t.id === selectedTopic);
      if (currentTopic) {
        const isAlreadyFollowing = followedTopics.some(t => t.id === selectedTopic);
        if (!isAlreadyFollowing) {
          await handleFollowTopic(selectedTopic, currentTopic.title);
          console.log("Auto-followed topic after reply:", selectedTopic);
        }
      }
    } catch (error) {
      console.error("Error auto-following topic after reply:", error);
    }

    setReplyContent("");
    setReplyWordCount(0);

    // Refresh posts list
    await fetchPosts();
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

    // Refresh posts list
    await fetchPosts();
  };

  // Delete post (correct Firestore path)
  const handleDelete = async (id) => {
    if (!selectedTopic) return;
    await deleteDoc(
      doc(db, `forums/${forumRoom}/topics/${selectedTopic}/posts`, id)
    );

    // Refresh posts list
    await fetchPosts();
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
    else if (userObj?.roles?.some((r) => r.toLowerCase() === "archivist"))
      nameClass += ` ${styles.archivistName}`;
    return nameClass;
  };

  return (
    <div className={styles.forumWrapper}>
      <h2>{forumTitle}</h2>
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
              {`Words: ${newTopicWordCount} / 300`}
              {newTopicWordCount < 300 && " (minimum 300 words to post)"}
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#8B7A6B",
                  marginTop: "4px",
                }}
              >
                Earn 50 nits for every 100 words written (minimum 300 words)!
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
              const isFollowing = followedTopics.some(t => t.id === topic.id);
              
              return (
                <div key={topic.id} className={styles.topicBox}>
                  <div className={styles.topicContent}>
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
                  <div className={styles.topicActions}>
                    <button
                      className={styles.followButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Star button clicked for topic:", topic.id);
                        handleFollowTopic(topic.id, topic.title);
                      }}
                      title={isFollowing ? "Unfollow topic" : "Follow topic"}
                      type="button"
                    >
                      {isFollowing ? "★" : "☆"}
                    </button>
                    {followerCounts[topic.id] > 0 && (
                      <button
                        className={styles.followerCountButton}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          fetchTopicFollowers(topic.id);
                        }}
                        title="View followers"
                        type="button"
                      >
                        {followerCounts[topic.id]} 👥
                      </button>
                    )}
                    {/* Debug: Show follower count even if 0 */}
                    <span style={{ fontSize: '0.8rem', color: '#d4c4a8', marginLeft: '8px' }}>
                      ({followerCounts[topic.id] || 0})
                    </span>
                  </div>
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
            {(() => {
              const isTeacherOrAdmin = roles?.includes("teacher") || roles?.includes("admin");
              
              return isTeacherOrAdmin && (
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
              );
            })()}
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
              {`Words: ${replyWordCount} / 300`}
              {replyWordCount < 300 && " (minimum 300 words to post)"}
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#8B7A6B",
                  marginTop: "4px",
                }}
              >
                Earn 50 nits for every 100 words written (minimum 300 words)!
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

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className={styles.followersModalOverlay} onClick={() => setShowFollowersModal(false)}>
          <div className={styles.followersModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.followersModalHeader}>
              <h3>Topic Followers ({selectedTopicFollowers.length})</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowFollowersModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.followersList}>
              {selectedTopicFollowers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#d4c4a8' }}>
                  No followers found for this topic.
                </div>
              ) : (
                selectedTopicFollowers.map((follower) => (
                  <div key={follower.id} className={styles.followerItem}>
                    <img 
                      src={follower.photoURL || "/icons/avatar.svg"} 
                      alt={follower.displayName}
                      className={styles.followerAvatar}
                    />
                    <div className={styles.followerInfo}>
                      <span className={getNameClass(follower.displayName)}>
                        {follower.displayName}
                      </span>
                      {follower.roles && follower.roles.length > 0 && (
                        <span className={styles.followerRoles}>
                          {follower.roles.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
