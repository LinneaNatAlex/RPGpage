import { useState, useRef, useEffect } from "react";
import styles from "./Chat.module.css";
import { FaPlus } from "react-icons/fa";

// Dummy users for search (replace with real user list from backend)
const dummyUsers = [
  { id: 1, name: "Simon Miles Sinclair" },
  { id: 2, name: "Zaccai Nex Xenakis" },
  { id: 3, name: "Damon Kayn Fitzroy" },
  { id: 4, name: "Lily Aria Rosenthal" },
];

const PrivateChat = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [activeChats, setActiveChats] = useState([]); // [{user, messages: []}]
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const chatBoxRef = useRef(null);

  // Filter users for search
  const filteredUsers = search
    ? dummyUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) &&
          !activeChats.some((c) => c.user.id === u.id)
      )
    : [];

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [activeChats, selectedUser]);

  // Add new private chat
  const addChat = (user) => {
    setActiveChats((prev) => [...prev, { user, messages: [] }]);
    setSelectedUser(user);
    setSearch("");
  };

  // Send message in active chat
  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    setActiveChats((prev) =>
      prev.map((c) =>
        c.user.id === selectedUser.id
          ? { ...c, messages: [...c.messages, { text: message, fromMe: true }] }
          : c
      )
    );
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
          cursor: "pointer",
          border: "2px solid #a084e8",
          borderBottom: "none",
        }}
        onClick={() => setIsCollapsed((prev) => !prev)}
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
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
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
                    key={u.id}
                    style={{ padding: 8, cursor: "pointer", color: "#a084e8" }}
                    onClick={() => addChat(u)}
                  >
                    {u.name}
                  </div>
                ))}
              </div>
            )}
            {activeChats.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {activeChats.map((c) => (
                  <button
                    key={c.user.id}
                    style={{
                      background:
                        selectedUser?.id === c.user.id ? "#a084e8" : "#23232b",
                      color:
                        selectedUser?.id === c.user.id ? "#23232b" : "#a084e8",
                      border: "1px solid #a084e8",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedUser(c.user)}
                  >
                    {c.user.name.split(" ")[0]}
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
                  .find((c) => c.user.id === selectedUser.id)
                  ?.messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: m.fromMe ? "right" : "left",
                        color: m.fromMe ? "#a084e8" : "#fff",
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
                  placeholder={`Message ${selectedUser.name}...`}
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
