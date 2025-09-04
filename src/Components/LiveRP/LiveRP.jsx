// importing the nessesitary function that is needed to send messages to the database
import { useState, useRef, useEffect } from "react";
import useChatMessages from "../../hooks/useChatMessages";
import { db, auth } from "../../firebaseConfig";
import styles from "./LiveRP.module.css"; // importing the css module for styling
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
  const [newMess, setNewMess] = useState("");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rpgGrateHall]);

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

  // --------------------CHAT FORM AND MESSAGE COMONENT / RENDERING-------------------
  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        width: "100%",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
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
      <div style={{ flex: 2 }}>
        <div className={styles.chatContainer}>
          <div className={styles.chatMessages}>
            {/* MODULE STYLED CLASSNAME Making sure the style wont interfare or clash with other components */}
            {rpgGrateHall.map((message) => (
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
                    <p className={styles.messageSender} style={{ margin: 0 }}>
                      {message.sender}:
                    </p>
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
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className={styles.chatForm} onSubmit={sendtMessage}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => execCmd("bold")}
                style={{ fontWeight: "bold" }}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => execCmd("italic")}
                style={{ fontStyle: "italic" }}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => execCmd("underline")}
                style={{ textDecoration: "underline" }}
              >
                U
              </button>
            </div>
            <div
              ref={inputRef}
              contentEditable
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="YOUR MESSAGES..."
              className={styles.chatInput}
              style={{
                resize: "vertical",
                fontSize: "1.1rem",
                width: "100%",
                minHeight: "60px",
                background: "#23232b",
                color: "#fff",
                borderRadius: "6px",
                border: "1px solid #a084e8",
                padding: "0.5rem",
              }}
              suppressContentEditableWarning={true}
            />
            <Button
              type="submit"
              className={styles.RpchatBtn}
              style={{ height: "40px", marginLeft: "1rem" }}
            >
              Send
            </Button>
            {error && <ErrorMessage message={error} />}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LiveRP;
