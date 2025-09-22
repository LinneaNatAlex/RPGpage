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
import { countWords, checkWordCountReward, updateUserWordCount } from "../../utils/wordCountReward";

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
  // const [nitsReward, setNitsReward] = useState(null); // Removed - no more popup messages
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    
    const wordCount = countWords(newMess);
    
    await addDoc(collection(db, "rpgGrateHall"), {
      text: newMess,
      timestamp: serverTimestamp(), // adds the timestam for the message
      sender: auth.currentUser.displayName,
      // gets the user name from firebase auth
    });
    
    // Update user's total word count and check for nits reward
    if (auth.currentUser) {
      const newTotalWordCount = await updateUserWordCount(auth.currentUser.uid, wordCount);
      const reward = await checkWordCountReward(auth.currentUser.uid, newTotalWordCount, newTotalWordCount - wordCount);
      
      // Reward system still works, but no popup message
      // if (reward.awarded) {
      //   setNitsReward(`You earned ${reward.nits} nits for writing ${wordCount} words!`);
      //   setTimeout(() => setNitsReward(null), 10000);
      // }
    }
    
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
        background: "rgba(44, 44, 44, 0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
          borderRadius: "16px",
          border: "2px solid #7B6857",
          color: "#F5EFE0",
          maxWidth: "95vw",
          width: "340px",
          padding: "2rem 1.2rem 1.2rem 1.2rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
            background: "linear-gradient(90deg, #D4C4A8 0%, #F5EFE0 50%, #D4C4A8 100%)",
          }}
        />
        <h2
          style={{
            color: "#F5EFE0",
            fontSize: "1.25rem",
            marginBottom: "1rem",
            fontWeight: "bold",
            textAlign: "center",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            fontFamily: "'Cinzel', serif",
          }}
        >
          Starshade Hall Rules
        </h2>
        <ul
          style={{
            fontSize: "1rem",
            lineHeight: "1.7",
            paddingLeft: 0,
            textAlign: "center",
            marginBottom: "2rem",
            listStylePosition: "inside",
            color: "#D4C4A8",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
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
              background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
              color: "#F5EFE0",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "0.7rem 1.5rem",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            }}
          >
            Show later
          </button>
          <button
            onClick={onNeverShow}
            style={{
              background: "linear-gradient(135deg, #6B6B6B 0%, #7B7B7B 100%)",
              color: "#F5EFE0",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "0.7rem 1.5rem",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
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
      {/* Removed nitsReward popup - no more popup messages */}
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
              background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
              border: "2px solid #7B6857",
              borderRadius: "12px",
              color: "#F5EFE0",
              padding: "1.5rem",
              minWidth: "220px",
              maxWidth: "300px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)",
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
                background: "linear-gradient(90deg, #D4C4A8 0%, #F5EFE0 50%, #D4C4A8 100%)",
              }}
            />
            <h2
              style={{
                color: "#F5EFE0",
                fontSize: "1.2rem",
                marginBottom: "1rem",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: "'Cinzel', serif",
                fontWeight: "600",
              }}
            >
              Starshade Hall Rules
            </h2>
            <ul
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.6",
                paddingLeft: "1.2rem",
                color: "#D4C4A8",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              {hallRules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: "0.5rem" }}>{rule}</li>
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
                            color: "#D4C4A8",
                            opacity: 0.8,
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
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
                            color: "#F5EFE0",
                            background: "linear-gradient(135deg, #8B4A4A 0%, #9B5A5A 100%)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "4px",
                            padding: "0.2rem 0.5rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "0.8rem",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                            transition: "all 0.2s ease",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
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
              <div style={{ 
                fontSize: "0.8rem", 
                color: "#8B7A6B", 
                marginTop: "4px",
                textAlign: "center"
              }}>
                Earn 50 nits for every 100 words written (minimum 300 words)!
              </div>
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
                    background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    transition: "all 0.3s ease",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
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
