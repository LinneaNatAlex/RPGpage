import { useState } from "react";
import useUsers from "../../hooks/useUser";
import useBooks from "../../hooks/useBooks";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import BookEditor from "../BookEditor/BookEditor";
import DeleteConfirmModal from "../DeleteConfirmModal/DeleteConfirmModal";

export default function TeacherPanel() {
  const { users } = useUsers();
  const { books, deleteBook, refetchBooks } = useBooks();
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(1);
  const [status, setStatus] = useState("");
  const [showBookEditor, setShowBookEditor] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [activeTab, setActiveTab] = useState("points");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  async function handleGivePoints() {
    if (!selected) return;
    setStatus("Arbeider...");
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

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        padding: 40,
        borderRadius: 20,
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
          borderRadius: "20px 20px 0 0",
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
          borderRadius: "12px",
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
            borderRadius: "8px",
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
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Book Management
        </button>
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
            <select
              onChange={(e) =>
                setSelected(users.find((u) => u.uid === e.target.value))
              }
              value={selected?.uid || ""}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                background: "#F5EFE0",
                color: "#2C2C2C",
                border: "2px solid #D4C4A8",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              <option value="">Choose user</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || u.email}
                </option>
              ))}
            </select>
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
              borderRadius: "12px",
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
                  borderRadius: "8px",
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
                  borderRadius: "8px",
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
              borderRadius: "12px",
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
                        borderRadius: "6px",
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
                        borderRadius: "6px",
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
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                width: 100,
                padding: "12px 16px",
                borderRadius: 8,
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
              borderRadius: "12px",
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

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={confirmDeleteBook}
        onCancel={cancelDeleteBook}
        itemName={bookToDelete?.title || "this book"}
      />
    </div>
  );
}
