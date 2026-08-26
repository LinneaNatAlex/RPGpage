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
import {
  countWords,
  checkWordCountReward,
  updateUserWordCount,
} from "../../utils/wordCountReward";

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
const LiveRP = ({ descriptionText, slotAboveDescription }) => {
  const { rpgGrateHall } = useChatMessages(); // destructuring the messages to get the rpgGrateHall messages
  const { users } = useUsers();
  const [newMess, setNewMess] = useState("");
  const [error, setError] = useState(null);
  const [isPrivilegedUser, setIsPrivilegedUser] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const [canUseRedText, setCanUseRedText] = useState(false);
  const [useRedText, setUseRedText] = useState(false);
  // const [nitsReward, setNitsReward] = useState(null); // Removed - no more popup messages
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(() => {
    const stored = localStorage.getItem("starshadeHallAutoScroll");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    async function checkPrivileged() {
      const user = auth.currentUser;
      if (!user) {
        setIsPrivilegedUser(false);
        setCanUseRedText(false);
        return;
      }
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const roles = data.roles || [];
        setIsPrivilegedUser(
          roles.includes("admin") ||
          (roles.includes("professor") || roles.includes("teacher")) ||
          roles.includes("headmaster") ||
          roles.includes("shadowpatrol")
        );
        setCanUseRedText(
          roles.includes("admin") ||
          roles.includes("headmaster") ||
          roles.includes("shadowpatrol") ||
          roles.includes("professor") ||
          roles.includes("teacher")
        );
      } else {
        setIsPrivilegedUser(false);
        setCanUseRedText(false);
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
    localStorage.setItem("starshadeHallAutoScroll", String(autoScrollToBottom));
  }, [autoScrollToBottom]);

  const scrollChatToBottom = () => {
    const el = chatBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    if (!autoScrollToBottom) return;
    scrollChatToBottom();
    const t1 = setTimeout(scrollChatToBottom, 50);
    const t2 = setTimeout(scrollChatToBottom, 150);
    const t3 = setTimeout(scrollChatToBottom, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [rpgGrateHall, autoScrollToBottom]);

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
    setError(null);
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to send messages.");
      return;
    }
    // Read from contentEditable so we send what's actually in the box
    const raw = inputRef.current ? inputRef.current.innerHTML : newMess;
    const text = (typeof raw === "string" ? raw : newMess || "").trim();
    const textOnly = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    if (!textOnly) return;

    try {
      await addDoc(collection(db, "rpgGrateHall"), {
        text: text,
        timestamp: serverTimestamp(),
        sender: user.displayName || "Anonymous",
        senderUid: user.uid,
        ...(canUseRedText && useRedText ? { useRedText: true } : {}),
      });
      if (autoScrollToBottom) {
        setTimeout(scrollChatToBottom, 100);
        setTimeout(scrollChatToBottom, 400);
      }

      const wordCount = countWords(text);
      if (wordCount > 0) {
        const newTotalWordCount = await updateUserWordCount(user.uid, wordCount);
        await checkWordCountReward(user.uid, newTotalWordCount, newTotalWordCount - wordCount);
      }

      setNewMess("");
      if (inputRef.current) inputRef.current.innerHTML = "";
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("permission") || msg.includes("Permission")) {
        setError("Cannot send: check that Firestore rules are deployed (rpgGrateHall: allow create for logged-in users).");
      } else {
        setError(msg || "Failed to send message.");
      }
    }
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

  return (
    <div className={styles.hallLayout}>
      <section className={styles.hallChat} aria-label="Starshade Hall chat">
          {isMobile && (
            <details className={styles.infoDropdown}>
              <summary className={styles.infoSummary}>About & rules</summary>
              <div className={styles.infoDropdownBody}>
                {descriptionText ? (
                  <>
                    <span className={styles.railLabel}>About this place</span>
                    <p className={styles.aboutText}>{descriptionText}</p>
                  </>
                ) : null}
                <h2 className={styles.rulesTitle}>Hall rules</h2>
                <ul className={styles.rulesList}>
                  {hallRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </details>
          )}
          <div className={styles.chatMessages} ref={chatBoxRef}>
            {rpgGrateHall.length === 0 && (
              <p className={styles.emptyLog}>
                The hall is quiet. Write in character to begin the scene.
              </p>
            )}
            {rpgGrateHall.map((message) => {
              const userObj = message.senderUid
                ? users?.find(
                    (u) =>
                      u.uid === message.senderUid || u.id === message.senderUid,
                  )
                : users?.find(
                    (u) =>
                      u.displayName &&
                      u.displayName.toLowerCase() ===
                        message.sender?.toLowerCase(),
                  );
              const displayName =
                userObj?.displayName || message.sender || "Anonymous";
              let nameClass = styles.messageSender;
              if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
                nameClass += ` ${styles.headmasterName}`;
              else if (
                userObj?.roles?.some(
                  (r) =>
                    (r || "").toLowerCase() === "professor" ||
                    (r || "").toLowerCase() === "teacher",
                )
              )
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
              const messageUsesRed = Boolean(message.useRedText);
              const initial = (displayName || "?").trim().charAt(0).toUpperCase();
              return (
                <div key={message.id} className={styles.message}>
                  {userObj?.profileImageUrl ? (
                    <img
                      className={styles.messageAvatar}
                      src={userObj.profileImageUrl}
                      alt=""
                    />
                  ) : (
                    <span className={styles.messageAvatarFallback} aria-hidden>
                      {initial}
                    </span>
                  )}
                  <div className={styles.messageMain}>
                    <div className={styles.messageNamecontainer}>
                      <strong className={nameClass}>{displayName}</strong>
                      {message.timestamp && (
                        <span className={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </span>
                      )}
                      {isPrivilegedUser && (
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div
                      className={`${styles.messageBody}${
                        messageUsesRed ? ` ${styles.messageBodyRed}` : ""
                      }`}
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.composer}>
            <div className={styles.composerTools}>
              <div className={styles.composerLeft}>
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
                {canUseRedText && (
                  <label className={styles.redTextLabel}>
                    <input
                      type="checkbox"
                      checked={useRedText}
                      onChange={(e) => setUseRedText(e.target.checked)}
                    />
                    <span>Write in red</span>
                  </label>
                )}
              </div>
              <div className={styles.autoScrollRow}>
                <button
                  type="button"
                  className={`${styles.autoScrollToggle}${
                    autoScrollToBottom ? ` ${styles.autoScrollToggleOn}` : ""
                  }`}
                  role="switch"
                  aria-checked={autoScrollToBottom}
                  aria-label="Auto-scroll to last message"
                  onClick={() => setAutoScrollToBottom((v) => !v)}
                >
                  <span>Auto-scroll</span>
                  <span className={styles.autoScrollSwitch} aria-hidden />
                </button>
              </div>
            </div>
            <form className={styles.chatForm} onSubmit={sendtMessage}>
              <input
                type="hidden"
                id="live-rp-message-field"
                name="liveRpMessage"
                value={newMess.replace(/<[^>]*>/g, "")}
                readOnly
                aria-hidden="true"
              />
              <div className={styles.composerRow}>
                <div
                  id="live-rp-message-input"
                  role="textbox"
                  aria-label="Roleplay message"
                  ref={inputRef}
                  contentEditable
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Write in character…"
                  className={styles.chatInput}
                  suppressContentEditableWarning={true}
                  data-name="liveRpMessage"
                  spellCheck
                  lang="en"
                />
                <Button type="submit" className={styles.RpchatBtn}>
                  Send
                </Button>
              </div>
              <div className={styles.nitsHint}>
                Earn 50 nits for every 100 words written (minimum 200 words)!
              </div>
              {error && <ErrorMessage message={error} />}
            </form>
          </div>
        </section>
        {!isMobile && (
        <aside className={styles.hallRail}>
          {slotAboveDescription}
          {descriptionText ? (
            <div className={styles.aboutCard}>
              <span className={styles.railLabel}>About this place</span>
              <p className={styles.aboutText}>{descriptionText}</p>
            </div>
          ) : null}
          <div className={styles.rulesCard}>
            <h2 className={styles.rulesTitle}>Hall rules</h2>
            <ul className={styles.rulesList}>
              {hallRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </aside>
        )}
    </div>
  );
};

export default LiveRP;
