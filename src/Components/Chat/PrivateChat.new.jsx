import { useState, useRef, useEffect } from "react";
import styles from "./Chat.module.css";
import { FaPlus } from "react-icons/fa";
import { auth, db } from "../../firebaseConfig";
import useUsers from "../../hooks/useUser";

const PrivateChat = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [activeChats, setActiveChats] = useState([]); // [{user, messages: []}]
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const chatBoxRef = useRef(null);
  const currentUser = auth.currentUser;
  const { users, loading } = useUsers();
  if (!currentUser) return null;

  // Filter users for search (exclude self and already active chats)
  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.uid !== currentUser.uid &&
          (u.displayName || u.name || u.uid)
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          !activeChats.some((c) => c.user.uid === u.uid)
      )
    : [];

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [activeChats, selectedUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes = activeChats.map((chat, idx) => {
      const chatId = [currentUser.uid, chat.user.uid].sort().join("_");
      const q =
        window.firebase && window.firebase.firestore
          ? window.firebase
              .firestore()
              .collection("privateMessages")
              .doc(chatId)
              .collection("messages")
              .orderBy("timestamp")
          : null;
      if (!q) return () => {};
      return q.onSnapshot((snapshot) => {
        setActiveChats((prev) => {
          const updated = [...prev];
          updated[idx] = {
            ...chat,
            messages: snapshot.docs.map((doc) => doc.data()),
          };
          return updated;
        });
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
    // eslint-disable-next-line
  }, [activeChats.length, currentUser]);

  // Add new private chat
  const addChat = (user) => {
    setActiveChats((prev) => [...prev, { user, messages: [] }]);
    setSelectedUser(user);
    setSearch("");
  };

  // Send message in active chat (Firestore)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || !currentUser) return;
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    await db
      .collection("privateMessages")
      .doc(chatId)
      .collection("messages")
      .add({
        text: message,
        from: currentUser.uid,
        to: selectedUser.uid,
        timestamp: new Date(),
      });
    setMessage("");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 370,
        width: 350,
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#23232b",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          border: "2px solid #a084e8",
          borderBottom: "none",
        }}
      >
        <span style={{ flex: 1, color: "#a084e8", fontWeight: 600 }}>
          Private Chat
        </span>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a084e8",
            fontSize: 18,
            cursor: "pointer",
          }}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? "▲" : "▼"}
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a084e8",
            fontSize: 18,
            marginLeft: 8,
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
            setSearch("");
          }}
        >
          <FaPlus />
        </button>
      </div>
      {!isCollapsed && (
        <div
          className={styles.chatContainer}
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderTop: "none",
            height: 500,
            minHeight: 200,
          }}
        >
          <div style={{ padding: "0.5rem 1rem" }}>
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 6,
                border: "1px solid #a084e8",
                marginBottom: 8,
              }}
            />
            {filteredUsers.length > 0 && (
              <div
                style={{
                  background: "#23232b",
                  border: "1px solid #a084e8",
                  borderRadius: 6,
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              >
                {filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    style={{ padding: 8, cursor: "pointer", color: "#a084e8" }}
                    onClick={() => addChat(u)}
                  >
                    {u.displayName || u.name || u.uid}
                  </div>
                ))}
              </div>
            )}
            {activeChats.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {activeChats.map((c) => (
                  <button
                    key={c.user.uid}
                    style={{
                      background:
                        selectedUser?.uid === c.user.uid
                          ? "#a084e8"
                          : "#23232b",
                      color:
                        selectedUser?.uid === c.user.uid
                          ? "#23232b"
                          : "#a084e8",
                      border: "1px solid #a084e8",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedUser(c.user)}
                  >
                    {
                      (c.user.displayName || c.user.name || c.user.uid).split(
                        " "
                      )[0]
                    }
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <>
              <div
                className={styles.chatMessages}
                ref={chatBoxRef}
                style={{ minHeight: 200, maxHeight: 300 }}
              >
                {activeChats
                  .find((c) => c.user.uid === selectedUser.uid)
                  ?.messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign:
                          m.from === currentUser?.uid ? "right" : "left",
                        color: m.from === currentUser?.uid ? "#a084e8" : "#fff",
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
              </div>
              <form className={styles.chatForm} onSubmit={sendMessage}>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  type="text"
                  placeholder={`Message ${
                    selectedUser.displayName ||
                    selectedUser.name ||
                    selectedUser.uid
                  }...`}
                  maxLength={200}
                  className={styles.chatInput}
                />
                <button type="submit" className={styles.chatBtn}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateChat;
