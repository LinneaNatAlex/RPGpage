// importing the nessesitary function that is needed to send messages to the database
import { useState, useRef, useEffect } from "react";
import useChatMessages from "../../hooks/useChatMessages";
import useUsers from "../../hooks/useUser";
import { db, auth } from "../../firebaseConfig";
import styles from "./LiveRP.module.css"; // importing the css module for styling
import {
  addDoc,
  collection,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Button from "../Button/Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

const hallRules = [
  "Be respectful to all participants.",
  "No spamming or flooding the chat.",
  "Stay in character during roleplay.",
  "No offensive language or bullying.",
  "Magic duels must be agreed upon by both parties.",
  "Keep OOC (out of character) comments to a minimum.",
  "Admins may moderate and remove inappropriate content.",
];

// costume hooks usestate to hold the new message input value
// useChatMessages costume hook to fetch messages, useState manages the states of 'newMess' input value!
const LiveRP = () => {
  const { rpgGrateHall } = useChatMessages(); // destructuring the messages to get the rpgGrateHall messages
  const { users } = useUsers();
  const [newMess, setNewMess] = useState("");
  const [error, setError] = useState(null);
  const [isPrivilegedUser, setIsPrivilegedUser] = useState(false);
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rpgGrateHall]);

  useEffect(() => {
    async function checkPrivileged() {
      const user = auth.currentUser;
      if (!user) return setIsPrivilegedUser(false);
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setIsPrivilegedUser(
          data.roles &&
            (data.roles.includes("admin") || data.roles.includes("teacher"))
        );
      } else {
        setIsPrivilegedUser(false);
      }
    }
    checkPrivileged();
  }, [auth.currentUser]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const neverShow = localStorage.getItem("hideRulesPopup");
      if (!neverShow) setShowRulesPopup(true);
    }
  }, [isMobile]);

  function execCmd(cmd) {
    document.execCommand(cmd, false, null);
    inputRef.current && inputRef.current.focus();
  }

  function handleInput(e) {
    setNewMess(e.currentTarget.innerHTML);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      sendtMessage(e);
    }
  }

  // ----------------------SEND MESSAGE FUNCTION-----------------------
  const sendtMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMess || newMess.replace(/<(.|\n)*?>/g, "").trim() === "") return;
    await addDoc(collection(db, "rpgGrateHall"), {
      text: newMess,
      timestamp: serverTimestamp(), // adds the timestam for the message

      sender: auth.currentUser.displayName,
      // gets the user name from firebase auth
    });
    setNewMess("");
    if (inputRef.current) inputRef.current.innerHTML = "";
  };

  function formatTime(ts) {
    if (!ts) return "";
    try {
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  async function handleDeleteMessage(id) {
    try {
      await deleteDoc(doc(db, "rpgGrateHall", id));
    } catch (err) {
      setError("Could not delete message");
    }
  }

  const handleCloseRulesPopup = () => setShowRulesPopup(false);
  const handleNeverShowRulesPopup = () => {
    localStorage.setItem("hideRulesPopup", "1");
    setShowRulesPopup(false);
  };

  const RulesPopup = ({ onClose, onNeverShow }) => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(60, 40, 100, 0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "#2d2540",
          borderRadius: "18px",
          border: "2px solid #a084e8",
          color: "#e2d9fa",
          maxWidth: "95vw",
          width: "340px",
          padding: "2rem 1.2rem 1.2rem 1.2rem",
          boxShadow: "0 4px 32px rgba(160,132,232,0.25)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2
          style={{
            color: "#a084e8",
            fontSize: "1.25rem",
            marginBottom: "1rem",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Great Hall Rules
        </h2>
        <ul
          style={{
            fontSize: "1rem",
            lineHeight: "1.7",
            paddingLeft: 0,
            textAlign: "center",
            marginBottom: "2rem",
            listStylePosition: "inside",
          }}
        >
          {hallRules.map((rule, idx) => (
            <li key={idx} style={{ marginBottom: "0.7rem" }}>
              {rule}
            </li>
          ))}
        </ul>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            marginTop: "0.5rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#a084e8",
              color: "#23232b",
              border: "none",
              borderRadius: "10px",
              padding: "0.7rem 1.5rem",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(160,132,232,0.15)",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Show later
          </button>
          <button
            onClick={onNeverShow}
            style={{
              background: "#fff",
              color: "#a084e8",
              border: "2px solid #a084e8",
              borderRadius: "10px",
              padding: "0.7rem 1.5rem",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(160,132,232,0.10)",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );

  // --------------------CHAT FORM AND MESSAGE COMONENT / RENDERING-------------------
  return (
    <>
      {isMobile && showRulesPopup && (
        <RulesPopup
          onClose={handleCloseRulesPopup}
          onNeverShow={handleNeverShowRulesPopup}
        />
      )}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          width: "100%",
          justifyContent: "center",
          alignItems: "flex-start",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {!isMobile && (
          <div
            style={{
              flex: 1,
              background: "#23232b",
              border: "2px solid #a084e8",
              borderRadius: "8px",
              color: "#b0aac2",
              padding: "1.5rem",
              minWidth: "220px",
              maxWidth: "300px",
            }}
          >
            <h2
              style={{
                color: "#a084e8",
                fontSize: "1.2rem",
                marginBottom: "1rem",
              }}
            >
              Great Hall Rules
            </h2>
            <ul
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.6",
                paddingLeft: "1.2rem",
              }}
            >
              {hallRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ flex: 2 }}>
          <div
            className={styles.chatContainer}
            style={isMobile ? { width: "100vw", overflowX: "auto" } : {}}
          >
            <div className={styles.chatMessages}>
              {/* MODULE STYLED CLASSNAME Making sure the style wont interfare or clash with other components */}
              {rpgGrateHall.map((message) => {
                // Finn brukerobjekt for å hente roller
                const userObj = users.find(
                  (u) =>
                    u.displayName &&
                    u.displayName.toLowerCase() ===
                      message.sender?.toLowerCase()
                );
                let nameClass = styles.messageSender;
                if (
                  userObj?.roles?.some((r) => r.toLowerCase() === "headmaster")
                )
                  nameClass += ` ${styles.headmasterName}`;
                else if (
                  userObj?.roles?.some((r) => r.toLowerCase() === "teacher")
                )
                  nameClass += ` ${styles.teacherName}`;
                else if (
                  userObj?.roles?.some(
                    (r) => r.toLowerCase() === "shadowpatrol"
                  )
                )
                  nameClass += ` ${styles.shadowPatrolName}`;
                else if (
                  userObj?.roles?.some((r) => r.toLowerCase() === "admin")
                )
                  nameClass += ` ${styles.adminName}`;
                return (
                  <div key={message.id} className={styles.message}>
                    <div
                      className={styles.messageNamecontainer}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.7rem",
                      }}
                    >
                      <strong>
                        <span className={nameClass} style={{ margin: 0 }}>
                          {message.sender}:
                        </span>
                      </strong>
                      {message.timestamp && (
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "#a084e8",
                            opacity: 0.8,
                          }}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      )}
                      {isPrivilegedUser && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          style={{
                            marginLeft: "1rem",
                            color: "#ff2a2a",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        textAlign: "left",
                        width: "100%",
                        fontSize: "1.15rem",
                      }}
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form className={styles.chatForm} onSubmit={sendtMessage}>
              <div className={styles.formatBar}>
                <button
                  type="button"
                  onClick={() => execCmd("bold")}
                  className={styles.formatBtn}
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("italic")}
                  className={styles.formatBtn}
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  onClick={() => execCmd("underline")}
                  className={styles.formatBtn}
                >
                  <u>U</u>
                </button>
              </div>
              <div
                ref={inputRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="YOUR MESSAGES..."
                className={styles.chatInput}
                suppressContentEditableWarning={true}
              />
              <Button
                type="submit"
                className={styles.RpchatBtn}
                style={{ height: "40px", marginTop: "0.5rem" }}
              >
                Send
              </Button>
              {error && <ErrorMessage message={error} />}
            </form>
            {isMobile && (
              <div style={{ textAlign: "center", marginTop: "0.7rem" }}>
                <button
                  type="button"
                  onClick={() => setShowRulesPopup(true)}
                  style={{
                    background: "none",
                    color: "#a084e8",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  Show rules
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveRP;
