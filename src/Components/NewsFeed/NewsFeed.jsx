import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import {
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
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

  const handleLike = async (item) => {
    if (!user) return;
    const newsRef = doc(db, "news", item.id);
    const likedBy = Array.isArray(item.likedBy) ? item.likedBy : [];
    const hasLiked = likedBy.includes(user.uid);
    try {
      if (hasLiked) {
        await updateDoc(newsRef, { likedBy: arrayRemove(user.uid) });
        setNewsList((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  likedBy: (p.likedBy || []).filter((uid) => uid !== user.uid),
                }
              : p,
          ),
        );
      } else {
        await updateDoc(newsRef, { likedBy: arrayUnion(user.uid) });
        setNewsList((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, likedBy: [...(p.likedBy || []), user.uid] }
              : p,
          ),
        );
        if (item.authorUid && item.authorUid !== user.uid) {
          const likerName = user.displayName?.trim() || user.email || "Someone";
          await addDoc(collection(db, "notifications"), {
            to: item.authorUid,
            type: "content_like",
            from: user.uid,
            fromUid: user.uid,
            fromName: likerName,
            targetType: "news",
            targetId: item.id,
            targetTitle: item.title || "your news",
            read: false,
            created: Date.now(),
          });
        }
      }
    } catch (err) {}
  };

  const { users } = useUsers();
  const { user, loading } = useAuth();
  const { roles: userRoles, rolesLoading: loadingRoles } = useUserRoles();
  const [newsList, setNewsList] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [titles, setTitles] = useState("");
  const NEWS_PER_PAGE = 3;
  const [newsPage, setNewsPage] = useState(1);
  const [postFormOpen, setPostFormOpen] = useState(false);

  // This CHECKS if the user has the role of admin, professor/teacher, or archivist. These roles can post news and delete posts.
  const isAdminOrTeacher =
    !loadingRoles &&
    Array.isArray(userRoles) &&
    (userRoles.includes("admin") ||
      (userRoles.includes("professor") || userRoles.includes("teacher")) ||
      userRoles.includes("archivist"));

  const fetchNews = async () => {
    try {
      const q = query(
        collection(db, "news"),
        orderBy("createdAt", "desc"),
        limit(25),
      );
      const snapshot = await getDocs(q);
      const newData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.type === "nyhet");
      setNewsList(newData);
    } catch (error) {
      setNewsList([]);
    }
  };

  useEffect(() => {
    if (loading || loadingRoles || !user) return;
    fetchNews();
  }, [user, loading, loadingRoles]);

  const totalNewsPages = Math.max(1, Math.ceil(newsList.length / NEWS_PER_PAGE));
  const paginatedNews = newsList.slice(
    (newsPage - 1) * NEWS_PER_PAGE,
    newsPage * NEWS_PER_PAGE
  );

  useEffect(() => {
    if (newsPage > totalNewsPages) setNewsPage(1);
  }, [totalNewsPages, newsPage]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await addDoc(collection(db, "news"), {
        title: titles,
        content: newPost,
        createdAt: serverTimestamp(),
        author: user.displayName,
        authorUid: user.uid,
        type: "nyhet",
      });
      setTitles("");
      setNewPost("");
      await fetchNews();
    } catch (err) {
      console.error("Failed to post news:", err);
    }
  };

  const [codeIframeHeights, setCodeIframeHeights] = useState({});

  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === "newsIframeHeight" && event.data?.id != null && typeof event.data?.height === "number") {
        setCodeIframeHeights((prev) => ({ ...prev, [event.data.id]: event.data.height }));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const getCodePostHtml = (content, itemId) => {
    let raw = (content || "")
      .replace("{{code}}", "")
      .replace("{{/code}}", "");
    raw = raw.replace(/(\s(?:src|href)\s*=\s*["'])http:\/\//gi, "$1https://");
    const isDark =
      typeof document !== "undefined" &&
      !!document.querySelector('[data-theme="dark"]');
    const bg = isDark ? "#252525" : "#F5EFE0";
    const fg = isDark ? "#e0e0e0" : "#2c2c2c";
    const scrollbarHide =
      "scrollbar-width:none;-ms-overflow-style:none;} html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0;}";
    const idEsc = JSON.stringify(String(itemId || ""));
    const reportHeight = itemId != null && itemId !== ""
      ? `<script>(function(){try{var h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);window.parent.postMessage({type:'newsIframeHeight',id:${idEsc},height:h},'*');}catch(e){}})();<\/script>`
      : "";
    return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0;background:${bg}!important;color:${fg};box-sizing:border-box;}*{box-sizing:inherit;} html,body{${scrollbarHide}}</style>
</head>
<body>${raw}${reportHeight}</body>
</html>`;
  };

  return (
    <div className={styles.newsFeedWrapper}>
      {/* Dropdown for posting news — tar lite plass når lukket */}
      {isAdminOrTeacher && (
        <div className={styles.newsAdminDropdown}>
          <button
            type="button"
            className={styles.newsAdminToggle}
            onClick={() => setPostFormOpen((open) => !open)}
            aria-expanded={postFormOpen}
            aria-controls="news-post-form"
            id="news-post-toggle"
          >
            <span>{postFormOpen ? "Close" : "Post news"}</span>
            <span className={styles.newsAdminToggleIcon} aria-hidden>
              {postFormOpen ? " ▲" : " ▼"}
            </span>
          </button>
          <div
            id="news-post-form"
            className={postFormOpen ? styles.newsAdminFormOpen : styles.newsAdminFormClosed}
            role="region"
            aria-labelledby="news-post-toggle"
          >
            <div className={styles.newsAdminContainer}>
              <input
                id="news-post-title"
                name="newsPostTitle"
                type="text"
                value={titles}
                onChange={(e) => setTitles(e.target.value)}
                placeholder="Title"
                required
                spellCheck
                lang="en"
              />
              <textarea
                id="news-post-content"
                name="newsPostContent"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="news here"
                className={styles.textArea}
                required
                spellCheck
                lang="en"
              />
              <Button
                onClick={handlePostSubmit}
                className={styles.handlePostSubmit}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Posted news — 3 per page, full content shown directly */}
      <div className={styles.newsContainer}>
        <>
          {paginatedNews.map((item, idx) => {
            // ...existing code...
            // Finn brukerobjekt for å hente roller
            const displayName = item.authorUid
              ? (users?.find((u) => u.uid === item.authorUid)?.displayName ?? item.author)
              : item.author;
            const userObj = item.authorUid
              ? users?.find((u) => u.uid === item.authorUid)
              : users.find(
                  (u) =>
                    u.displayName &&
                    u.displayName.toLowerCase() === item.author?.toLowerCase(),
                );
            let nameClass = styles.posterName;
            if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
              nameClass += ` ${styles.headmasterName}`;
            else if (userObj?.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher"))
              nameClass += ` ${styles.professorName}`;
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
                      <span className={nameClass}>{displayName}</span>
                      {item.createdAt && (
                        <span className={styles.postDate}>
                          •{" "}
                          {new Date(item.createdAt.toDate()).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      )}
                    </div>
                    <div className={styles.likeRow}>
                      <button
                        type="button"
                        className={styles.likeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item);
                        }}
                        title={
                          Array.isArray(item.likedBy) &&
                          item.likedBy.includes(user?.uid)
                            ? "Unlike"
                            : "Like"
                        }
                        aria-label={
                          Array.isArray(item.likedBy) &&
                          item.likedBy.includes(user?.uid)
                            ? "Unlike"
                            : "Like"
                        }
                      >
                        {Array.isArray(item.likedBy) &&
                        item.likedBy.includes(user?.uid)
                          ? "❤️"
                          : "🤍"}
                      </button>
                      {Array.isArray(item.likedBy) &&
                        item.likedBy.length > 0 && (
                          <span className={styles.likeCount}>
                            {item.likedBy.length}
                          </span>
                        )}
                    </div>
                  </div>
                  {item.content.startsWith("{{code}}") ? (
                    <div className={styles.codePostInline}>
                      <iframe
                        title={`News: ${item.title || "content"}`}
                        className={styles.codePostIframe}
                        style={{
                          minHeight: 200,
                          height: codeIframeHeights[item.id] || 800,
                        }}
                        srcDoc={getCodePostHtml(item.content, item.id)}
                      />
                      <button
                        type="button"
                        className={styles.fullScreenLink}
                        onClick={() => {
                          setSelectedPost(item);
                          setModalOpen(true);
                        }}
                      >
                        Open full screen
                      </button>
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
            className={styles.popupContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupContent}>
              <iframe
                title="News content"
                className={styles.popupIframe}
                srcDoc={getCodePostHtml(selectedPost.content)}
              />
            </div>
            <div className={styles.otherNewsSidebar}>
              <h3>Other News</h3>
              <div className={styles.otherNewsGrid}>
                {newsList
                  .filter(
                    (post) =>
                      post.id !== selectedPost.id &&
                      post.content.startsWith("{{code}}"),
                  )
                  .slice(0, 4)
                  .map((post) => {
                    const postDisplayName = post.authorUid
                      ? (users?.find((u) => u.uid === post.authorUid)?.displayName ?? post.author)
                      : post.author;
                    const userObj = post.authorUid
                      ? users?.find((u) => u.uid === post.authorUid)
                      : users.find(
                          (u) =>
                            u.displayName &&
                            u.displayName.toLowerCase() ===
                              post.author?.toLowerCase(),
                        );
                    let nameClass = styles.posterName;
                    if (
                      userObj?.roles?.some(
                        (r) => r.toLowerCase() === "headmaster",
                      )
                    )
                      nameClass += ` ${styles.headmasterName}`;
                    else if (
                      userObj?.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
                    )
                      nameClass += ` ${styles.professorName}`;
                    else if (
                      userObj?.roles?.some(
                        (r) => r.toLowerCase() === "archivist",
                      )
                    )
                      nameClass += ` ${styles.archivistName}`;

                    return (
                      <div
                        key={post.id}
                        className={styles.otherNewsItem}
                        onClick={() => setSelectedPost(post)}
                      >
                        <h4>{post.title}</h4>
                        <div className={styles.otherNewsAuthor}>
                          <span className={nameClass}>{postDisplayName}</span>
                          {post.createdAt && (
                            <span className={styles.otherNewsDate}>
                              {new Date(
                                post.createdAt.toDate(),
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {newsList.filter(
                  (post) =>
                    post.id !== selectedPost.id &&
                    post.content.startsWith("{{code}}"),
                ).length === 0 && (
                  <p className={styles.noOtherNews}>No other news available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Pagination: under calendar on desktop (portal), below news on mobile */}
      {totalNewsPages > 1 &&
        (() => {
          const start = (newsPage - 1) * NEWS_PER_PAGE + 1;
          const end = Math.min(newsPage * NEWS_PER_PAGE, newsList.length);
          const paginationUI = (
            <div className={styles.newsPagination}>
              <span className={styles.newsPaginationInfo}>
                {newsList.length} news total — showing {start}–{end}
              </span>
              <div className={styles.newsPaginationButtons}>
                <button
                  type="button"
                  className={styles.newsPageBtn}
                  disabled={newsPage <= 1}
                  onClick={() => setNewsPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      className={newsPage === p ? styles.newsPageBtnActive : styles.newsPageBtn}
                      onClick={() => setNewsPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={newsPage === p ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className={styles.newsPageBtn}
                  disabled={newsPage >= totalNewsPages}
                  onClick={() => setNewsPage((p) => Math.min(totalNewsPages, p + 1))}
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </div>
            </div>
          );
          if (typeof document !== "undefined") {
            const portalEl = document.getElementById("news-pagination-portal");
            const usePortal = portalEl && typeof window !== "undefined" && window.matchMedia("(min-width: 1001px)").matches;
            if (usePortal) return createPortal(paginationUI, portalEl);
          }
          return paginationUI;
        })()}
    </div>
  );
};

export default NewsFeed;
