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

// Rich text editor with synonym suggestions
import ReactQuillWithSynonyms from "../../Components/ReactQuillWithSynonyms/ReactQuillWithSynonyms";
import RepetitionWarningComponent from "../../Components/RepetitionWarning/RepetitionWarningComponent";

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
  "18plus": "18+ Forum",
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
  const [isPrivateTopic, setIsPrivateTopic] = useState(false);
  const [allowedUserIds, setAllowedUserIds] = useState([]);
  const [privateTopicSearch, setPrivateTopicSearch] = useState("");
  const [privateTopicUserPage, setPrivateTopicUserPage] = useState(0);
  const [ageVerifiedUsersList, setAgeVerifiedUsersList] = useState([]);
  const PRIVATE_TOPIC_USERS_PER_PAGE = 10;
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

  const is18PlusForum = forumRoom === "18plus";

  // Fetch all 18+ verified users from Firestore for private topic picker (reliable list)
  useEffect(() => {
    if (!is18PlusForum) return;
    let cancelled = false;
    (async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("ageVerified", "==", true)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        setAgeVerifiedUsersList(list);
      } catch (err) {
        if (!cancelled) setAgeVerifiedUsersList([]);
      }
    })();
    return () => { cancelled = true; };
  }, [is18PlusForum]);

  // Searchable list: 18+ users excluding current user, filtered by search
  const ageVerifiedUsersFiltered = (ageVerifiedUsersList || [])
    .filter((u) => u.uid !== user?.uid)
    .filter((u) => {
      if (!privateTopicSearch.trim()) return true;
      const term = privateTopicSearch.trim().toLowerCase();
      const name = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });

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
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (is18PlusForum && user) {
        list = list.filter(
          (t) =>
            !t.isPrivate ||
            t.uid === user.uid ||
            (t.allowedUserIds && t.allowedUserIds.includes(user.uid))
        );
      }
      setTopics(list);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [forumRoom, is18PlusForum, user?.uid]);

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
    } catch (error) {
      console.error("Error fetching follower counts:", error);
    }
  };

  // Fetch followers for a specific topic
  const fetchTopicFollowers = async (topicId) => {
    try {
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
        }
      });
      
      setSelectedTopicFollowers(followers);
      setShowFollowersModal(true);
    } catch (error) {
      console.error("Error fetching topic followers:", error);
    }
  };

  // Sanitize topic objects so Firestore never receives undefined (invalid)
  const sanitizeFollowedTopics = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list
      .filter((t) => t != null && (t.id != null && t.id !== ""))
      .map((t) => ({
        id: String(t.id ?? ""),
        title: String(t.title ?? ""),
        forum: String(t.forum ?? ""),
        forumRoom: String(t.forumRoom ?? ""),
        followedAt: String(t.followedAt ?? new Date().toISOString()),
      }));
  };

  // Follow/Unfollow topic
  const handleFollowTopic = async (topicId, topicTitle) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const isFollowing = followedTopics.some(t => t && t.id === topicId);
      
      let updatedFollowedTopics;
      if (isFollowing) {
        // Unfollow
        updatedFollowedTopics = followedTopics.filter(t => t && t.id !== topicId);
      } else {
        // Follow – ensure no undefined is sent to Firestore
        const newTopic = {
          id: String(topicId ?? ""),
          title: String(topicTitle ?? ""),
          forum: String(forumTitle ?? ""),
          forumRoom: String(forumRoom ?? ""),
          followedAt: new Date().toISOString(),
        };
        updatedFollowedTopics = [...(Array.isArray(followedTopics) ? followedTopics : []), newTopic];
      }
      
      const sanitized = sanitizeFollowedTopics(updatedFollowedTopics);
      
      // Update database first (never send undefined to Firestore)
      await updateDoc(userRef, {
        followedTopics: sanitized
      });
      
      // Then update state
      setFollowedTopics(sanitized);
      
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

  // Send notifications to users who follow topics in this forum
  const sendNotificationToForumFollowers = async (topicId, topicTitle) => {
    try {
      // Get all users who have followed any topics in this forum
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const forumFollowers = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.followedTopics && Array.isArray(userData.followedTopics)) {
          // Check if they follow any topics in this forum
          const followsTopicsInForum = userData.followedTopics.some(topic => 
            topic.forumRoom === forumRoom
          );
          if (followsTopicsInForum && doc.id !== user.uid) { // Don't notify the person who created
            forumFollowers.push(doc.id);
          }
        }
      });

      // Send notification to each forum follower
      for (const followerId of forumFollowers) {
        try {
          await addDoc(collection(db, "notifications"), {
            to: followerId,
            from: user.uid,
            fromName: user.displayName,
            type: "new_topic",
            title: "New Topic in Followed Forum",
            message: `${user.displayName} created a new topic "${topicTitle}" in ${forumRoom}`,
            topicId: topicId,
            forumRoom: forumRoom,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          // Skip this notification if it fails
        }
      }
    } catch (error) {
      // Error fetching followers or sending notifications
    }
  };

  // Send notifications to all followers of a topic
  const sendNotificationToTopicFollowers = async (topicId, topicTitle) => {
    try {
      // Get all users who follow this topic
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const followers = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.followedTopics && Array.isArray(userData.followedTopics)) {
          const isFollowing = userData.followedTopics.some(topic => topic.id === topicId);
          if (isFollowing && doc.id !== user.uid) { // Don't notify the person who posted
            followers.push(doc.id);
          }
        }
      });

      // Send notification to each follower
      for (const followerId of followers) {
        try {
          await addDoc(collection(db, "notifications"), {
            to: followerId,
            from: user.uid,
            fromName: user.displayName,
            type: "topic_reply",
            title: "New Reply in Followed Topic",
            message: `${user.displayName} replied to "${topicTitle}"`,
            topicId: topicId,
            forumRoom: forumRoom,
            read: false,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          // Skip this notification if it fails
        }
      }
    } catch (error) {
      // Error fetching followers or sending notifications
    }
  };

  // Create new topic
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || isContentEmpty(newTopicContent)) return;

    const wordCount = countWords(newTopicContent);

    const topicData = {
      title: newTopicTitle,
      author: user.displayName,
      createdAt: serverTimestamp(),
      uid: user.uid,
    };
    if (is18PlusForum && isPrivateTopic) {
      topicData.isPrivate = true;
      topicData.allowedUserIds = [user.uid, ...(allowedUserIds || [])];
    }
    const topicRef = await addDoc(
      collection(db, `forums/${forumRoom}/topics`),
      topicData
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
      }
    } catch (error) {
      // Error auto-following topic
    }

    // Send notifications to users who might be interested in new topics in this forum (skip for private topics)
    if (!(is18PlusForum && isPrivateTopic)) {
      try {
        await sendNotificationToForumFollowers(topicRef.id, newTopicTitle);
      } catch (error) {
        // Error sending notifications
      }
    }

    setNewTopicTitle("");
    setNewTopicContent("");
    setNewTopicWordCount(0);
    setIsPrivateTopic(false);
    setAllowedUserIds([]);
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
        }
      }
    } catch (error) {
      // Error auto-following topic after reply
    }

    // Send notifications to all followers of this topic
    try {
      await sendNotificationToTopicFollowers(selectedTopic, currentTopic?.title || 'Unknown Topic');
    } catch (error) {
      // Error sending notifications
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
            {is18PlusForum && (
              <p style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(160, 132, 232, 0.2)", border: "1px solid #a084e8", borderRadius: 0, fontSize: "0.9rem" }}>
                When you create the first post below, you can choose if the topic is private and who can see it (only 18+ verified users).
              </p>
            )}
            <label htmlFor="forum-new-topic-title" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              New topic title
            </label>
            <input
              id="forum-new-topic-title"
              name="newTopicTitle"
              autoComplete="off"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="New topic title"
              className={styles.newTopicInput}
            />
            <ReactQuillWithSynonyms
              id="forum-new-topic-content"
              name="newTopicContent"
              value={newTopicContent}
              onChange={(val) => {
                setNewTopicContent(val);
                const wordCount = countWords(val);
                setNewTopicWordCount(wordCount);
              }}
              className={styles.newTopicEditor}
              enableSynonyms={true}
            />
            <RepetitionWarningComponent text={newTopicContent} />
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
            {is18PlusForum && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  background: "#2a2a32",
                  borderRadius: 0,
                  border: "2px solid #a084e8",
                }}
              >
                <span style={{ display: "block", marginBottom: 10, fontSize: "1rem", fontWeight: 700, color: "#c4b5fd" }}>
                  Set when creating this first post: private or not, and who can see it
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} htmlFor="forum-private-topic-checkbox">
                    <input
                      id="forum-private-topic-checkbox"
                      name="isPrivateTopic"
                      type="checkbox"
                      checked={isPrivateTopic}
                      onChange={(e) => {
                        setIsPrivateTopic(e.target.checked);
                        if (!e.target.checked) setAllowedUserIds([]);
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        minWidth: 20,
                        minHeight: 20,
                        accentColor: "#a084e8",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <span>Private topic (only people you select below can see and reply)</span>
                  </label>
                  <div>
                    {isPrivateTopic ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsPrivateTopic(false);
                          setAllowedUserIds([]);
                        }}
                        style={{
                          padding: "10px 18px",
                          background: "#5d4e37",
                          color: "#f5efe0",
                          border: "2px solid #a084e8",
                          borderRadius: 0,
                          cursor: "pointer",
                          fontSize: "1rem",
                          fontWeight: 700,
                        }}
                      >
                        Make topic public
                      </button>
                    ) : (
                      <span style={{ color: "#8bc34a", fontSize: "0.95rem", fontWeight: 600 }}>Topic will be public (everyone in 18+ forum can see it)</span>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{ display: "block", marginBottom: 8, fontSize: "0.9rem" }}>
                    Select one or more users who can see and reply (you can select multiple). List shows only 18+ verified users (you are always included):
                  </span>
                  <input
                    id="forum-private-topic-search"
                    name="privateTopicSearch"
                    type="text"
                    placeholder="Search by name or email..."
                    value={privateTopicSearch}
                    onChange={(e) => {
                      setPrivateTopicSearch(e.target.value);
                      setPrivateTopicUserPage(0);
                    }}
                    style={{
                      width: "100%",
                      maxWidth: 320,
                      padding: "8px 12px",
                      marginBottom: 10,
                      background: "#1a1a22",
                      border: "1px solid #444",
                      borderRadius: 0,
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {ageVerifiedUsersFiltered.length === 0 ? (
                      <span style={{ color: "#888" }}>
                        {privateTopicSearch.trim()
                          ? "No matching 18+ users."
                          : "No other 18+ verified users to add."}
                      </span>
                    ) : (
                      (() => {
                        const totalPages = Math.max(1, Math.ceil(ageVerifiedUsersFiltered.length / PRIVATE_TOPIC_USERS_PER_PAGE));
                        const pageStart = privateTopicUserPage * PRIVATE_TOPIC_USERS_PER_PAGE;
                        const pageUsers = ageVerifiedUsersFiltered.slice(pageStart, pageStart + PRIVATE_TOPIC_USERS_PER_PAGE);
                        return (
                          <>
                            {pageUsers.map((u) => {
                        const isSelected = allowedUserIds.includes(u.uid);
                        return (
                          <label
                            key={u.uid}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              cursor: "pointer",
                              padding: "8px 10px",
                              background: isSelected ? "rgba(160, 132, 232, 0.4)" : "transparent",
                              border: isSelected ? "2px solid #a084e8" : "2px solid transparent",
                              borderRadius: 4,
                            }}
                          >
                            <input
                              id={`forum-private-user-${u.uid}`}
                              name="privateTopicUser"
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAllowedUserIds((prev) => [...prev, u.uid]);
                                } else {
                                  setAllowedUserIds((prev) => prev.filter((id) => id !== u.uid));
                                }
                              }}
                              style={{
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                minHeight: 22,
                                accentColor: "#4ade80",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ flex: 1 }}>{u.displayName || u.email || u.uid}</span>
                            {isSelected && (
                              <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.95rem" }}>✓ Chosen</span>
                            )}
                          </label>
                        );
                      })}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                onClick={() => setPrivateTopicUserPage((p) => Math.max(0, p - 1))}
                                disabled={privateTopicUserPage === 0}
                                style={{
                                  padding: "6px 12px",
                                  background: privateTopicUserPage === 0 ? "#444" : "#5d4e37",
                                  color: "#f5efe0",
                                  border: "1px solid #7b6857",
                                  borderRadius: 0,
                                  cursor: privateTopicUserPage === 0 ? "not-allowed" : "pointer",
                                  fontSize: "0.9rem",
                                }}
                              >
                                Previous page
                              </button>
                              <span style={{ color: "#d4c4a8", fontSize: "0.9rem" }}>
                                Page {privateTopicUserPage + 1} of {totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPrivateTopicUserPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={privateTopicUserPage >= totalPages - 1}
                                style={{
                                  padding: "6px 12px",
                                  background: privateTopicUserPage >= totalPages - 1 ? "#444" : "#5d4e37",
                                  color: "#f5efe0",
                                  border: "1px solid #7b6857",
                                  borderRadius: 0,
                                  cursor: privateTopicUserPage >= totalPages - 1 ? "not-allowed" : "pointer",
                                  fontSize: "0.9rem",
                                }}
                              >
                                Next page
                              </button>
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                  {allowedUserIds.length > 0 && (
                    <span style={{ display: "block", marginTop: 8, fontSize: "0.85rem", color: "#c4b5fd" }}>
                      {allowedUserIds.length} user(s) selected. Remember to check &quot;Private topic&quot; above if this topic should be private.
                    </span>
                  )}
                </div>
              </div>
            )}
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
                      {topic.isPrivate && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: "0.75rem",
                            color: "#ffd86b",
                            fontWeight: 600,
                          }}
                          title="Private topic – only selected users can see and reply"
                        >
                          🔒 Private
                        </span>
                      )}
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
      {selectedTopic && (() => {
        const currentTopic = topics.find((t) => t.id === selectedTopic);
        if (!currentTopic) {
          return (
            <div className={styles.topicView}>
              <p style={{ color: "#ffd86b", marginBottom: 16 }}>
                Topic not found or you don&apos;t have access to this private topic.
              </p>
              <Button onClick={() => setSelectedTopic(null)} className={styles.backButton}>
                Back to topics
              </Button>
            </div>
          );
        }
        return (
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
              const isTeacherOrAdmin = roles?.includes("teacher") || roles?.includes("admin") || roles?.includes("archivist");
              
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
          {currentTopic.isPrivate && (
            <div
              style={{
                marginBottom: "1.2rem",
                padding: "10px 14px",
                background: "rgba(160, 132, 232, 0.15)",
                border: "1px solid #a084e8",
                borderRadius: 0,
                fontSize: "0.9rem",
              }}
            >
              <span style={{ fontWeight: 700, color: "#c4b5fd" }}>Who has access to this topic: </span>
              {(() => {
                const creatorUid = currentTopic.uid;
                const allowedIds = currentTopic.allowedUserIds || [];
                const allIds = [creatorUid, ...allowedIds.filter((id) => id !== creatorUid)];
                const nameFor = (id) => {
                  const u = (users || []).find((x) => x.uid === id) || (ageVerifiedUsersList || []).find((x) => x.uid === id);
                  return u?.displayName || u?.email || id;
                };
                const names = allIds.map((id) => nameFor(id));
                return names.join(", ");
              })()}
            </div>
          )}
          {editingTopic && (
            <div
              style={{
                background: "#23232b",
                borderRadius: 0,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <label htmlFor="forum-edit-topic-title" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                Edit topic title
              </label>
              <input
                id="forum-edit-topic-title"
                name="editTopicTitle"
                value={editTopicTitle}
                onChange={(e) => setEditTopicTitle(e.target.value)}
                className={styles.titleInput}
                style={{ marginBottom: 16, width: "100%" }}
                placeholder="Edit topic title"
              />
              <ReactQuillWithSynonyms
                id="forum-edit-topic-content"
                name="editTopicContent"
                value={editTopicContent}
                onChange={setEditTopicContent}
                className={styles.quill}
                enableSynonyms={true}
              />
              <RepetitionWarningComponent text={editTopicContent} />
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
                      <ReactQuillWithSynonyms
                        id="forum-edit-post-content"
                        name="editPostContent"
                        value={editContent}
                        onChange={setEditContent}
                        className={styles.quill}
                        enableSynonyms={true}
                      />
                      <RepetitionWarningComponent text={editContent} />
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
            <ReactQuillWithSynonyms
              id="forum-reply-content"
              name="replyContent"
              value={replyContent}
              onChange={(val) => {
                setReplyContent(val);
                const wordCount = countWords(val);
                setReplyWordCount(wordCount);
              }}
              className={styles.quill}
              enableSynonyms={true}
            />
            <RepetitionWarningComponent text={replyContent} />
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
        );
      })()}

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

