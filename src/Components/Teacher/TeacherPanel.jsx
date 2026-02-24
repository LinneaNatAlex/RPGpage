import { useState, useEffect } from "react";
import useUsers from "../../hooks/useUser";
import useBooks from "../../hooks/useBooks";
import useUserData from "../../hooks/useUserData";
import useSegmentSchedule from "../../hooks/useSegmentSchedule";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import BookEditor from "../BookEditor/BookEditor";
import LibraryEditor from "../LibraryEditor/LibraryEditor";
import DeleteConfirmModal from "../DeleteConfirmModal/DeleteConfirmModal";
import useLibrary from "../../hooks/useLibrary";
import { forumList } from "../../data/forumList";
import { cacheHelpers } from "../../utils/firebaseCache";

const LEAD_LABELS = { archivist: "Archivist", shadowpatrol: "Shadow Patrol" };

export default function TeacherPanel() {
  const { user } = useAuth();
  const { userData } = useUserData();
  const { users } = useUsers();
  const leadForRole = userData?.leadForRole || null;
  const { tasks, loading: tasksLoading, addTask, removeTask } = useSegmentSchedule(leadForRole || undefined);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const { books, deleteBook, refetchBooks } = useBooks();
  const { items: libraryItems, deleteItem: deleteLibraryItem, refetchItems: refetchLibrary } = useLibrary();
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(1);
  const [status, setStatus] = useState("");
  const [showBookEditor, setShowBookEditor] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [showLibraryEditor, setShowLibraryEditor] = useState(false);
  const [editingLibraryItem, setEditingLibraryItem] = useState(null);
  const [libraryToDelete, setLibraryToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("points");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [forumDescSelectedSlug, setForumDescSelectedSlug] = useState("");
  const [forumDescOpenTabs, setForumDescOpenTabs] = useState([]);
  const [forumDescActiveId, setForumDescActiveId] = useState("");
  const [forumDescEdits, setForumDescEdits] = useState({});
  const [forumDescLoading, setForumDescLoading] = useState(null);
  const [forumDescSaving, setForumDescSaving] = useState(false);
  const [forumDescStatus, setForumDescStatus] = useState("");

  const USERS_PER_PAGE = 10;

  const filteredUsers = users.filter(
    (u) =>
      !userSearch.trim() ||
      (u.displayName || "")
        .toLowerCase()
        .includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  );
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE
  );

  useEffect(() => {
    if (userPage > totalUserPages) setUserPage(1);
  }, [totalUserPages]);

  async function handleGivePoints() {
    if (!selected) return;
    setStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return setStatus("Bruker ikke funnet");
    const data = snap.data();
    const newPoints = (data.points || 0) + amount;
    await updateDoc(ref, { points: newPoints });
    setStatus(`Points updated: ${newPoints}`);
  }

  const handleCreateBook = () => {
    setEditingBook(null);
    setShowBookEditor(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowBookEditor(true);
  };

  const handleDeleteBook = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      await deleteBook(bookToDelete.id);
      setStatus("Book deleted successfully");
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      setStatus("Error deleting book");
      setShowDeleteModal(false);
      setBookToDelete(null);
    }
  };

  const cancelDeleteBook = () => {
    setShowDeleteModal(false);
    setBookToDelete(null);
  };

  const confirmDeleteLibrary = async () => {
    if (!libraryToDelete) return;
    try {
      await deleteLibraryItem(libraryToDelete.id);
      setStatus("Library entry deleted.");
      setLibraryToDelete(null);
    } catch {
      setStatus("Error deleting library entry.");
    }
  };
  const cancelDeleteLibrary = () => setLibraryToDelete(null);

  const handleBookSave = () => {
    setShowBookEditor(false);
    setEditingBook(null);
    setStatus("Book saved successfully");
    // Force refresh books list
    setTimeout(() => {
      refetchBooks();
    }, 1000);
  };

  const handleBookCancel = () => {
    setShowBookEditor(false);
    setEditingBook(null);
  };

  const forumDescRef = doc(db, "config", "forumDescriptions");

  const openForumDescPage = async () => {
    const slug = forumDescSelectedSlug;
    if (!slug) return;
    if (forumDescOpenTabs.includes(slug)) {
      setForumDescActiveId(slug);
      return;
    }
    setForumDescLoading(slug);
    setForumDescStatus("");
    try {
      const cached = cacheHelpers.getForumDescriptions();
      const descriptions = cached?.descriptions || {};
      if (Object.keys(descriptions).length > 0) {
        setForumDescEdits((prev) => ({ ...prev, [slug]: descriptions[slug] || "" }));
        setForumDescOpenTabs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
        setForumDescActiveId(slug);
        setForumDescLoading(null);
        return;
      }
      const snap = await getDoc(forumDescRef);
      const data = snap.exists() ? snap.data() : {};
      const desc = data.descriptions || {};
      cacheHelpers.setForumDescriptions({ descriptions: desc });
      setForumDescEdits((prev) => ({ ...prev, [slug]: desc[slug] || "" }));
      setForumDescOpenTabs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      setForumDescActiveId(slug);
    } catch {
      setForumDescStatus("Failed to load.");
    } finally {
      setForumDescLoading(null);
    }
  };

  const closeForumDescTab = (slug) => {
    setForumDescOpenTabs((prev) => prev.filter((s) => s !== slug));
    setForumDescEdits((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    if (forumDescActiveId === slug) {
      const remaining = forumDescOpenTabs.filter((s) => s !== slug);
      setForumDescActiveId(remaining[0] ?? "");
    }
  };

  const setForumDescEdit = (slug, text) => {
    setForumDescEdits((prev) => ({ ...prev, [slug]: text }));
  };

  const saveAllForumDescriptions = async () => {
    if (forumDescOpenTabs.length === 0) return;
    setForumDescSaving(true);
    setForumDescStatus("");
    setStatus("");
    try {
      let base = cacheHelpers.getForumDescriptions()?.descriptions || {};
      if (Object.keys(base).length === 0) {
        const snap = await getDoc(forumDescRef);
        base = (snap.exists() ? snap.data() : {}).descriptions || {};
      }
      const merged = { ...base };
      forumDescOpenTabs.forEach((slug) => {
        merged[slug] = (forumDescEdits[slug] ?? "").trim();
      });
      await setDoc(forumDescRef, { descriptions: merged }, { merge: true });
      cacheHelpers.setForumDescriptions({ descriptions: merged });
      setForumDescStatus(`Saved ${forumDescOpenTabs.length} forum(s).`);
      setStatus("Forum descriptions saved.");
      setTimeout(() => setForumDescStatus(""), 4000);
    } catch (err) {
      setForumDescStatus(err?.message || "Failed to save.");
    } finally {
      setForumDescSaving(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        padding: 40,
        borderRadius: 0,
        boxShadow:
          "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
        border: "3px solid #7B6857",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: 0,
        }}
      />
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: "2.2rem",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        Teacher Panel
      </h2>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          marginBottom: "2rem",
          background: "rgba(245, 239, 224, 0.1)",
          borderRadius: 0,
          padding: "4px",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <button
          onClick={() => setActiveTab("points")}
          style={{
            flex: 1,
            padding: "12px 24px",
            background:
              activeTab === "points"
                ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                : "transparent",
            color: activeTab === "points" ? "#F5EFE0" : "#D4C4A8",
            border: "none",
            borderRadius: 0,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Points Management
        </button>
        <button
          onClick={() => setActiveTab("books")}
          style={{
            flex: 1,
            padding: "12px 24px",
            background:
              activeTab === "books"
                ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                : "transparent",
            color: activeTab === "books" ? "#F5EFE0" : "#D4C4A8",
            border: "none",
            borderRadius: 0,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Book Management
        </button>
        <button
          onClick={() => setActiveTab("library")}
          style={{
            flex: 1,
            padding: "12px 24px",
            background:
              activeTab === "library"
                ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                : "transparent",
            color: activeTab === "library" ? "#F5EFE0" : "#D4C4A8",
            border: "none",
            borderRadius: 0,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Library (tips)
        </button>
        <button
          onClick={() => setActiveTab("forumDescriptions")}
          style={{
            flex: 1,
            padding: "12px 24px",
            background:
              activeTab === "forumDescriptions"
                ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                : "transparent",
            color: activeTab === "forumDescriptions" ? "#F5EFE0" : "#D4C4A8",
            border: "none",
            borderRadius: 0,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Forum descriptions
        </button>
        {leadForRole && (
          <button
            onClick={() => setActiveTab("lead")}
            style={{
              flex: 1,
              padding: "12px 24px",
              background:
                activeTab === "lead"
                  ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                  : "transparent",
              color: activeTab === "lead" ? "#F5EFE0" : "#D4C4A8",
              border: "none",
              borderRadius: 0,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {LEAD_LABELS[leadForRole] || leadForRole} lead
          </button>
        )}
      </div>

      {/* Points Management Tab */}
      {activeTab === "points" && (
        <>
          <div
            style={{
              marginBottom: 20,
              background: "rgba(245, 239, 224, 0.1)",
              padding: 20,
              borderRadius: 12,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <label
              htmlFor="teacher-user-search"
              style={{
                color: "#D4C4A8",
                fontSize: "1.1rem",
                fontWeight: 600,
                fontFamily: '"Cinzel", serif',
                display: "block",
                marginBottom: 12,
              }}
            >
              Select User:
            </label>
            <input
              id="teacher-user-search"
              name="teacherUserSearch"
              type="text"
              autoComplete="off"
              placeholder="Search user (name or email)..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 0,
                background: "#F5EFE0",
                color: "#2C2C2C",
                border: "2px solid #D4C4A8",
                fontSize: "1rem",
                marginBottom: 10,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                maxHeight: 280,
                overflowY: "auto",
                background: "rgba(245, 239, 224, 0.08)",
                borderRadius: 0,
                border: "2px solid rgba(212, 196, 168, 0.4)",
              }}
            >
              {paginatedUsers.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#D4C4A8",
                    fontStyle: "italic",
                  }}
                >
                  {userSearch.trim()
                    ? "No users match search"
                    : "No users"}
                </div>
              ) : (
                paginatedUsers.map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => setSelected(u)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(u);
                      }
                    }}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(123, 104, 87, 0.2)",
                      background:
                        selected?.uid === u.uid
                          ? "rgba(123, 104, 87, 0.5)"
                          : "transparent",
                      color: selected?.uid === u.uid ? "#F5EFE0" : "#D4C4A8",
                      fontWeight: selected?.uid === u.uid ? 600 : 400,
                    }}
                  >
                    {u.displayName || u.email || u.uid}
                  </div>
                ))
              )}
            </div>
            {filteredUsers.length > USERS_PER_PAGE && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 0,
                    border: "2px solid #D4C4A8",
                    background: "#5D4E37",
                    color: "#F5EFE0",
                    cursor: userPage === 1 ? "not-allowed" : "pointer",
                    opacity: userPage === 1 ? 0.6 : 1,
                    fontSize: "0.9rem",
                  }}
                >
                  ← Previous
                </button>
                <span
                  style={{
                    color: "#D4C4A8",
                    fontSize: "0.9rem",
                  }}
                >
                  Page {userPage} of {totalUserPages} ({filteredUsers.length}{" "}
                  results)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setUserPage((p) => Math.min(totalUserPages, p + 1))
                  }
                  disabled={userPage === totalUserPages}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 0,
                    border: "2px solid #D4C4A8",
                    background: "#5D4E37",
                    color: "#F5EFE0",
                    cursor:
                      userPage === totalUserPages ? "not-allowed" : "pointer",
                    opacity: userPage === totalUserPages ? 0.6 : 1,
                    fontSize: "0.9rem",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
            {selected && (
              <p
                style={{
                  marginTop: 10,
                  color: "#D4C4A8",
                  fontSize: "0.95rem",
                }}
              >
                Valgt: <strong>{selected.displayName || selected.email}</strong>
              </p>
            )}
          </div>
        </>
      )}

      {/* Book Management Tab */}
      {activeTab === "books" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              background: "rgba(245, 239, 224, 0.1)",
              padding: "1rem",
              borderRadius: 0,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h3
              style={{
                color: "#D4C4A8",
                fontSize: "1.3rem",
                fontWeight: 600,
                fontFamily: '"Cinzel", serif',
                margin: 0,
              }}
            >
              Books Library
            </h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => refetchBooks()}
                style={{
                  background:
                    "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 0,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Refresh Books
              </button>
              <button
                onClick={handleCreateBook}
                style={{
                  background:
                    "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 0,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Create New Book
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              background: "rgba(245, 239, 224, 0.05)",
              borderRadius: 0,
              border: "1px solid rgba(123, 104, 87, 0.3)",
            }}
          >
            {books.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#D4C4A8",
                  fontStyle: "italic",
                }}
              >
                No books created yet. Create your first book!
              </div>
            ) : (
              books.map((book) => (
                <div
                  key={book.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid rgba(123, 104, 87, 0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        color: "#F5EFE0",
                        margin: "0 0 0.5rem 0",
                        fontSize: "1.1rem",
                      }}
                    >
                      {book.title}
                    </h4>
                    <p
                      style={{
                        color: "#D4C4A8",
                        margin: "0 0 0.5rem 0",
                        fontSize: "0.9rem",
                      }}
                    >
                      by {book.author}
                    </p>
                    <p
                      style={{
                        color: "#B8A082",
                        margin: 0,
                        fontSize: "0.8rem",
                      }}
                    >
                      {book.pages?.length || 0} pages • {book.price || 0} points
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleEditBook(book)}
                      style={{
                        background:
                          "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                        color: "#F5EFE0",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 0,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book)}
                      style={{
                        background:
                          "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                        color: "#F5EFE0",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 0,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Library (tips) Tab */}
      {activeTab === "library" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              background: "rgba(245, 239, 224, 0.1)",
              padding: "1rem",
              borderRadius: 0,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div>
              <h3
                style={{
                  color: "#D4C4A8",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  fontFamily: '"Cinzel", serif',
                  margin: 0,
                }}
              >
                Library – tips you should know
              </h3>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.9rem", color: "rgba(212, 196, 168, 0.9)" }}>
                Archivist, teacher, headmaster and admin can add and edit tips.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => refetchLibrary()}
                style={{
                  background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 0,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  setEditingLibraryItem(null);
                  setShowLibraryEditor(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                  color: "#F5EFE0",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 0,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                New library entry
              </button>
            </div>
          </div>
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              background: "rgba(245, 239, 224, 0.05)",
              borderRadius: 0,
              border: "1px solid rgba(123, 104, 87, 0.3)",
            }}
          >
            {libraryItems.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#D4C4A8",
                  fontStyle: "italic",
                }}
              >
                No library entries yet. Add tips and information for users (free to read, not sold in shop).
              </div>
            ) : (
              libraryItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid rgba(123, 104, 87, 0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ color: "#F5EFE0", margin: 0, fontSize: "1.1rem" }}>
                    {item.title}
                  </h4>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => {
                        setEditingLibraryItem(item);
                        setShowLibraryEditor(true);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                        color: "#F5EFE0",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 0,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setLibraryToDelete(item)}
                      style={{
                        background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                        color: "#F5EFE0",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 0,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Forum descriptions Tab */}
      {activeTab === "forumDescriptions" && (
        <>
          <div
            style={{
              marginBottom: 20,
              background: "rgba(245, 239, 224, 0.1)",
              padding: 20,
              borderRadius: 12,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <p style={{ fontSize: "0.9rem", color: "#D4C4A8", marginBottom: 16 }}>
              Open one or more forums, edit descriptions, then click Save once to save all open forums.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <select
                value={forumDescSelectedSlug}
                onChange={(e) => setForumDescSelectedSlug(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  padding: "10px 12px",
                  borderRadius: 0,
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  border: "2px solid #D4C4A8",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Choose forum…</option>
                {forumList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openForumDescPage}
                disabled={!forumDescSelectedSlug || forumDescLoading !== null}
                style={{
                  background: forumDescSelectedSlug && !forumDescLoading ? "linear-gradient(135deg, #5D4E37 0%, #4a3d2a 100%)" : "#999",
                  color: "#F5EFE0",
                  border: "2px solid #D4C4A8",
                  borderRadius: 0,
                  padding: "10px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: forumDescSelectedSlug && !forumDescLoading ? "pointer" : "not-allowed",
                }}
              >
                {forumDescLoading ? "Loading…" : "Open page"}
              </button>
            </div>

            {forumDescOpenTabs.length > 0 && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12, borderBottom: "2px solid rgba(255,255,255,0.2)", paddingBottom: 8 }}>
                  {forumDescOpenTabs.map((slug) => {
                    const label = forumList.find((f) => f.id === slug)?.name ?? slug;
                    const isActive = slug === forumDescActiveId;
                    return (
                      <div
                        key={slug}
                        role="button"
                        tabIndex={0}
                        onClick={() => setForumDescActiveId(slug)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setForumDescActiveId(slug);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 10px",
                          background: isActive ? "rgba(245,239,224,0.15)" : "rgba(123,104,87,0.2)",
                          border: `2px solid ${isActive ? "#D4C4A8" : "rgba(212,196,168,0.4)"}`,
                          borderRadius: 0,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ color: "#F5EFE0", fontSize: "0.9rem", fontWeight: isActive ? 600 : 400 }}>
                          {label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); closeForumDescTab(slug); }}
                          aria-label="Close tab"
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0 4px",
                            cursor: "pointer",
                            color: "#D4C4A8",
                            fontSize: "1.1rem",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                {forumDescActiveId && (
                  <>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#D4C4A8" }}>
                      Description (shown at top of forum)
                    </label>
                    <textarea
                      value={forumDescEdits[forumDescActiveId] ?? ""}
                      onChange={(e) => setForumDescEdit(forumDescActiveId, e.target.value)}
                      placeholder="Write a description of the place so users can picture it when roleplaying here."
                      rows={8}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 0,
                        background: "#F5EFE0",
                        color: "#2C2C2C",
                        border: "2px solid #D4C4A8",
                        fontSize: "1rem",
                        boxSizing: "border-box",
                        resize: "vertical",
                        fontFamily: "inherit",
                        marginBottom: 16,
                      }}
                    />
                    <button
                      type="button"
                      onClick={saveAllForumDescriptions}
                      disabled={forumDescSaving}
                      style={{
                        background: forumDescSaving ? "#999" : "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                        color: "#F5EFE0",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: 0,
                        fontWeight: 600,
                        cursor: forumDescSaving ? "not-allowed" : "pointer",
                        fontFamily: '"Cinzel", serif',
                      }}
                    >
                      {forumDescSaving ? "Saving…" : "Save all open forums"}
                    </button>
                    {forumDescStatus && (
                      <span style={{ marginLeft: 12, color: forumDescStatus.startsWith("Failed") ? "#e57373" : "#D4C4A8" }}>
                        {forumDescStatus}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Segment Lead Tab (Archivist / Shadow Patrol) */}
      {leadForRole && activeTab === "lead" && (
        <>
          <div
            style={{
              marginBottom: 20,
              background: "rgba(245, 239, 224, 0.1)",
              padding: 20,
              borderRadius: 0,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h3 style={{ color: "#D4C4A8", fontSize: "1.2rem", marginBottom: 12, fontFamily: '"Cinzel", serif' }}>
              {LEAD_LABELS[leadForRole]} – overview
            </h3>
            <p style={{ color: "#D4C4A8", fontSize: "0.95rem", marginBottom: 16 }}>
              Users with the role <strong>{LEAD_LABELS[leadForRole]}</strong>:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {users
                .filter((u) => Array.isArray(u.roles) && u.roles.map((r) => String(r).toLowerCase()).includes(leadForRole))
                .map((u) => (
                  <li
                    key={u.uid}
                    style={{
                      padding: "8px 12px",
                      marginBottom: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderLeft: "4px solid #7B6857",
                      color: "#F5EFE0",
                    }}
                  >
                    {u.displayName || u.email || u.uid}
                  </li>
                ))}
            </ul>
            {users.filter((u) => Array.isArray(u.roles) && u.roles.map((r) => String(r).toLowerCase()).includes(leadForRole)).length === 0 && (
              <p style={{ color: "#D4C4A8", fontStyle: "italic" }}>No users with this role.</p>
            )}
          </div>
          <div
            style={{
              marginBottom: 20,
              background: "rgba(245, 239, 224, 0.1)",
              padding: 20,
              borderRadius: 0,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h3 style={{ color: "#D4C4A8", fontSize: "1.2rem", marginBottom: 12, fontFamily: '"Cinzel", serif' }}>
              Add task / deadline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              <input
                placeholder="Title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 0,
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
              />
              <textarea
                placeholder="Description"
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                rows={3}
                style={{
                  padding: "10px 12px",
                  borderRadius: 0,
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
              <input
                type="datetime-local"
                placeholder="Deadline"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 0,
                  border: "2px solid #D4C4A8",
                  background: "#F5EFE0",
                  color: "#2C2C2C",
                  fontSize: "1rem",
                }}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                setTaskStatus("Adding…");
                try {
                  await addTask(newTaskTitle, newTaskDesc, newTaskDeadline ? new Date(newTaskDeadline).getTime() : null, user?.displayName || user?.email || "");
                  setNewTaskTitle("");
                  setNewTaskDesc("");
                  setNewTaskDeadline("");
                  setTaskStatus("Added.");
                  setTimeout(() => setTaskStatus(""), 2000);
                } catch (err) {
                  setTaskStatus(err?.message || "Failed to add task.");
                  setTimeout(() => setTaskStatus(""), 4000);
                }
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 0,
                border: "none",
                background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                color: "#F5EFE0",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Add task
            </button>
            {taskStatus && <p style={{ marginTop: 8, color: "#D4C4A8", fontSize: "0.9rem" }}>{taskStatus}</p>}
          </div>
          <div
            style={{
              background: "rgba(245, 239, 224, 0.1)",
              padding: 20,
              borderRadius: 0,
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h3 style={{ color: "#D4C4A8", fontSize: "1.2rem", marginBottom: 12, fontFamily: '"Cinzel", serif' }}>
              Tasks and deadlines
            </h3>
            {tasksLoading ? (
              <p style={{ color: "#D4C4A8" }}>Loading…</p>
            ) : tasks.length === 0 ? (
              <p style={{ color: "#D4C4A8", fontStyle: "italic" }}>No tasks yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(212, 196, 168, 0.3)",
                      color: "#F5EFE0",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: "0.95rem", marginBottom: 4 }}>{t.description}</div>}
                    {t.deadline && (
                      <div style={{ fontSize: "0.85rem", color: "#D4C4A8" }}>
                        Deadline: {new Date(t.deadline).toLocaleString()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTask(t.id)}
                      style={{
                        marginTop: 8,
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        background: "rgba(139, 0, 0, 0.4)",
                        color: "#F5EFE0",
                        border: "none",
                        borderRadius: 0,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {selected && (
        <div
          style={{
            marginBottom: 20,
            background: "rgba(245, 239, 224, 0.1)",
            padding: 20,
            borderRadius: 12,
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <label
            htmlFor="teacher-points-amount"
            style={{
              color: "#D4C4A8",
              fontSize: "1.1rem",
              fontWeight: 600,
              fontFamily: '"Cinzel", serif',
              display: "block",
              marginBottom: 12,
            }}
          >
            Points to give:
          </label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              id="teacher-points-amount"
              name="pointsAmount"
              type="number"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                width: 100,
                padding: "12px 16px",
                borderRadius: 0,
                background: "#F5EFE0",
                color: "#2C2C2C",
                border: "2px solid #D4C4A8",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            />
            <button
              onClick={handleGivePoints}
              style={{
                background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              Give Points
            </button>
          </div>
        </div>
      )}

      {status && (
        <div
          style={{
            color: "#D4C4A8",
            marginTop: 20,
            padding: 16,
            background: "rgba(212, 196, 168, 0.1)",
            borderRadius: 12,
            border: "1px solid rgba(212, 196, 168, 0.3)",
            fontSize: "1.1rem",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {status}
        </div>
      )}

      {/* Book Editor Modal */}
      {showBookEditor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
              borderRadius: 0,
              border: "3px solid #7B6857",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <BookEditor
              book={editingBook}
              onSave={handleBookSave}
              onCancel={handleBookCancel}
            />
          </div>
        </div>
      )}

      {showLibraryEditor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
              borderRadius: 0,
              border: "3px solid #7B6857",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <LibraryEditor
              entry={editingLibraryItem}
              existingCategories={[...new Set(libraryItems.map((i) => i.category).filter(Boolean))]}
              onSave={() => {
                setShowLibraryEditor(false);
                setEditingLibraryItem(null);
                setStatus("Library entry saved.");
                refetchLibrary();
              }}
              onCancel={() => {
                setShowLibraryEditor(false);
                setEditingLibraryItem(null);
              }}
            />
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal || !!libraryToDelete}
        onConfirm={libraryToDelete ? confirmDeleteLibrary : confirmDeleteBook}
        onCancel={() => {
          cancelDeleteBook();
          cancelDeleteLibrary();
        }}
        itemName={libraryToDelete?.title || bookToDelete?.title || "this item"}
      />
    </div>
  );
}
