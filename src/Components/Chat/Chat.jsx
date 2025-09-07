// importing the nessesarty function that is needed to send messages to the database
import { useState, useRef, useEffect } from "react";
import useChatMessages from "../../hooks/useChatMessages";
import useUsers from "../../hooks/useUser";
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

// costume hooks usestate to hold the new message input value
// useChatMessages costume hook to fetch messages, useState manages the states of 'newMess' input value!
const Chat = () => {
  const { messages } = useChatMessages();
  const { users } = useUsers();
  const [newMess, setNewMess] = useState("");
  const [error, setError] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    e.preventDefault(); // preventing the form from refresing the page when form is submited

    if (!newMess.trim()) return;

    await addDoc(collection(db, "messages"), {
      text: newMess,
      timestamp: serverTimestamp(), // adds the timestam for the message

      sender: auth.currentUser.displayName,
      // gets the user name from firebase auth
    });

    setNewMess(""); // this clears the input field after pressing enter! Makes sure the input field is empty after sending a message
    // Scroll til bunn etter sending
    setTimeout(() => {
      if (endOfMessagesRef.current) {
        endOfMessagesRef.current.scrollIntoView({ behavior: "auto" });
      }
    }, 0);
  };

  // --------------------CHAT FORM AND MESSAGE COMONENT / RENDERING-------------------
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
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
            {/* MODULE STYLED CLASSNAME Making sure the style wont interfare or clash with other components */}
            {messages.map((message) => {
              // Find the user object by displayName (case-insensitive)
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
                    <strong className={roleClass}>{message.sender}</strong>
                  </span>
                  <span className={styles.messageText}>: {message.text}</span>
                </div>
              );
            })}
          </div>
          <form className={styles.chatForm} onSubmit={sendtMessage}>
            <input
              value={newMess}
              onChange={(e) => setNewMess(e.target.value)}
              type="text"
              placeholder="your messages..."
              maxLength={200}
              className={`${styles.chatInput} ${styles.textArea}`}
            />
            {/* ^ form input field for new messages */}
            <Button type="submit" className={styles.chatBtn}>
              Send
            </Button>
            {error && <ErrorMessage message={error} />}
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;
