import { useState, useRef, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import useChatMessages from "../../hooks/useChatMessages";
import useUsers from "../../hooks/useUser";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import { db, auth } from "../../firebaseConfig";
import styles from "./Chat.module.css";
import {
  addDoc,
  collection,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Button from "../Button/Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

const Chat = () => {
  const { messages } = useChatMessages();
  const { users } = useUsers();
  const onlineUsers = useOnlineUsers();
  const [newMess, setNewMess] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef();
  const [error, setError] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  // Husk om chatten var lukket eller åpen (default: lukket)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("mainChatCollapsed");
    return stored === null ? true : stored === "true";
  });
  // Oppdater localStorage når isCollapsed endres
  useEffect(() => {
    localStorage.setItem("mainChatCollapsed", isCollapsed);
  }, [isCollapsed]);
  const chatBoxRef = useRef(null);

  // Sjekk om innlogget bruker har admin, teacher, headmaster eller shadow patrol-rolle
  const currentUserObj = users.find(
    (u) =>
      u.displayName &&
      u.displayName.toLowerCase() ===
        auth.currentUser?.displayName?.toLowerCase()
  );
  const canDelete = currentUserObj?.roles?.some((r) =>
    ["admin", "teacher", "headmaster", "shadowpatrol"].includes(r.toLowerCase())
  );

  // Slett melding
  const handleDeleteMessage = async (id) => {
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      setError("Could not delete message.");
    }
  };

  // Scroll til bunn etter sending
  useEffect(() => {
    if (!isCollapsed && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isCollapsed]);

  // ----------------------SEND MESSAGE FUNCTION-----------------------
  const sendtMessage = async (e) => {
    e.preventDefault();
    if (!newMess.trim()) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: newMess,
        sender: auth.currentUser?.displayName || "",
        timestamp: serverTimestamp(),
      });
      setNewMess("");
    } catch (err) {
      setError("Could not send message.");
    }
  };

  // Filtrer kun online brukere for @mention autocomplete
  const mentionableUsers = onlineUsers.filter(
    (u) =>
      u.displayName &&
      (!mentionQuery ||
        u.displayName.toLowerCase().startsWith(mentionQuery.toLowerCase()))
  );

  // Håndter input for @mention
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMess(value);
    // Finn siste @ og tekst etter
    const match = value.match(/@([\wæøåÆØÅ\- ]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  // Sett inn valgt brukernavn
  const handleSelectMention = (displayName) => {
    const before = newMess.replace(/@([\wæøåÆØÅ\- ]*)$/, "@");
    setNewMess(before + displayName + " ");
    setShowMentions(false);
    setMentionQuery("");
    inputRef.current?.focus();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: 350,
        zIndex: 2000,
        boxShadow: "0 0 12px #0008",
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
        <span style={{ flex: 1, color: "#a084e8", fontWeight: 600 }}>Chat</span>
        <button
          style={{
            background: "none",
            border: "none",
            color: "#a084e8",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          {isCollapsed ? "▲" : "▼"}
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
          <div className={styles.chatMessages} ref={chatBoxRef}>
            {messages.map((message) => {
              const userObj = users.find(
                (u) =>
                  u.displayName &&
                  u.displayName.toLowerCase() === message.sender?.toLowerCase()
              );
              let roleClass = styles.messageSender;
              if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
                roleClass += ` ${styles.headmasterSender}`;
              else if (
                userObj?.roles?.some((r) => r.toLowerCase() === "teacher")
              )
                roleClass += ` ${styles.teacherSender}`;
              else if (
                userObj?.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
              )
                roleClass += ` ${styles.shadowPatrolSender}`;
              else if (userObj?.roles?.some((r) => r.toLowerCase() === "admin"))
                roleClass += ` ${styles.adminSender}`;
              return (
                <div key={message.id} className={styles.message}>
                  <span className={styles.senderNameWrapper}>
                    {canDelete && (
                      <span className={styles.gearMenuWrapper}>
                        <button
                          className={styles.gearButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === message.id ? null : message.id
                            );
                          }}
                          aria-label="Options"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              stroke="#ff5e5e"
                              strokeWidth="2"
                              fill="#23232b"
                            />
                            <path
                              d="M10 6v2m0 4v2m-4-4h2m4 0h2"
                              stroke="#ff5e5e"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        {menuOpenId === message.id && (
                          <div className={styles.optionsMenu}>
                            <button
                              className={styles.deleteOption}
                              onClick={() => {
                                handleDeleteMessage(message.id);
                                setMenuOpenId(null);
                              }}
                            >
                              Slett
                            </button>
                          </div>
                        )}
                      </span>
                    )}
                    <strong className={roleClass}>
                      {message.sender
                        ? (() => {
                            const parts = message.sender.trim().split(" ");
                            if (parts.length === 1) return parts[0];
                            if (parts.length > 1)
                              return parts[0] + " " + parts[parts.length - 1];
                            return "";
                          })()
                        : ""}
                    </strong>
                  </span>
                  {/* Uthev @mentions og @all i meldingen */}
                  <span
                    className={
                      styles.messageText +
                      (message.text
                        ?.toLowerCase()
                        .includes(
                          `@${auth.currentUser?.displayName?.toLowerCase()}`
                        )
                        ? " " + styles.mentionHighlight
                        : "") +
                      (message.text?.toLowerCase().includes("@all")
                        ? " " + styles.mentionAll
                        : "")
                    }
                  >
                    :{" "}
                    {message.text?.split(/(\s+)/).map((part, i) => {
                      if (
                        part.toLowerCase() ===
                        `@${auth.currentUser?.displayName?.toLowerCase()}`
                      ) {
                        return (
                          <span key={i} className={styles.mentionHighlight}>
                            {part}
                          </span>
                        );
                      }
                      if (part.toLowerCase() === "@all") {
                        return (
                          <span key={i} className={styles.mentionAll}>
                            {part}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </span>
                </div>
              );
            })}
          </div>
          <form className={styles.chatForm} onSubmit={sendtMessage}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  ref={inputRef}
                  value={newMess}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="YOUR MESSAGES..."
                  maxLength={200}
                  className={`${styles.chatInput} ${styles.textArea}`}
                  style={{ width: "100%", minWidth: 0 }}
                />
                <button
                  type="button"
                  className={styles.emojiBtn}
                  onClick={() => setShowEmoji((v) => !v)}
                  aria-label="Add emoji"
                >
                  😊
                </button>
                {showEmoji && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 60,
                      right: 0,
                      zIndex: 9999,
                    }}
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji) => {
                        setNewMess(
                          (prev) => prev + (emoji.native || emoji.colons || "")
                        );
                        setShowEmoji(false);
                      }}
                      theme="dark"
                    />
                  </div>
                )}
              </div>
              <Button type="submit" className={styles.chatBtn}>
                Send
              </Button>
            </div>
            {error && <ErrorMessage message={error} />}
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;
