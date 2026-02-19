import { useState, useRef, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import useChatMessages from "../../hooks/useChatMessages";
import useUsers from "../../hooks/useUser";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import { db, auth } from "../../firebaseConfig";
import { getRaceColor } from "../../utils/raceColors";
import styles from "./Chat.module.css";
import {
  addDoc,
  collection,
  serverTimestamp,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import Button from "../Button/Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import { playPing, preparePingSound } from "./ping_alt";

const Chat = () => {
  const { messages } = useChatMessages();
  const { users } = useUsers();
  const onlineUsers = useOnlineUsers();
  const onlineUids = new Set(onlineUsers.map((u) => u.id));
  const [newMess, setNewMess] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef();
  const [error, setError] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [mentionActiveIdx, setMentionActiveIdx] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  // Husk om chatten var lukket eller åpen (default: lukket)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("mainChatCollapsed");
    return stored === null ? true : stored === "true";
  });
  // Auto-scroll til siste melding når man åpner/replyer (kan slås av)
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(() => {
    const stored = localStorage.getItem("mainChatAutoScroll");
    return stored === null ? true : stored === "true";
  });

  // Potion effect states
  const [hairColorUntil, setHairColorUntil] = useState(null);
  const [rainbowUntil, setRainbowUntil] = useState(null);
  const [glowUntil, setGlowUntil] = useState(null);
  const [translationUntil, setTranslationUntil] = useState(null);
  const [echoUntil, setEchoUntil] = useState(null);
  const [whisperUntil, setWhisperUntil] = useState(null);
  const [shoutUntil, setShoutUntil] = useState(null);
  const [mysteryUntil, setMysteryUntil] = useState(null);
  const [charmUntil, setCharmUntil] = useState(null);
  const [inLoveUntil, setInLoveUntil] = useState(null);
  const [rainbowColor, setRainbowColor] = useState("#ff6b6b");

  // Rainbow Potion effect - change color every 10 seconds
  useEffect(() => {
    if (!rainbowUntil || rainbowUntil <= Date.now()) return;

    const interval = setInterval(() => {
      setRainbowColor(getRandomColor());
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [rainbowUntil]);

  // Oppdater localStorage når isCollapsed endres
  useEffect(() => {
    localStorage.setItem("mainChatCollapsed", isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem("mainChatAutoScroll", String(autoScrollToBottom));
  }, [autoScrollToBottom]);

  // Load user's potion effects
  // QUOTA OPTIMIZATION: Use polling instead of real-time listener
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchUserPotions = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHairColorUntil(
            data.hairColorUntil && data.hairColorUntil > Date.now()
              ? data.hairColorUntil
              : null,
          );
          setRainbowUntil(
            data.rainbowUntil && data.rainbowUntil > Date.now()
              ? data.rainbowUntil
              : null,
          );
          setGlowUntil(
            data.glowUntil && data.glowUntil > Date.now()
              ? data.glowUntil
              : null,
          );
          setTranslationUntil(
            data.translationUntil && data.translationUntil > Date.now()
              ? data.translationUntil
              : null,
          );
          setEchoUntil(
            data.echoUntil && data.echoUntil > Date.now()
              ? data.echoUntil
              : null,
          );
          setWhisperUntil(
            data.whisperUntil && data.whisperUntil > Date.now()
              ? data.whisperUntil
              : null,
          );
          setShoutUntil(
            data.shoutUntil && data.shoutUntil > Date.now()
              ? data.shoutUntil
              : null,
          );
          setMysteryUntil(
            data.mysteryUntil && data.mysteryUntil > Date.now()
              ? data.mysteryUntil
              : null,
          );
          setCharmUntil(
            data.charmUntil && data.charmUntil > Date.now()
              ? data.charmUntil
              : null,
          );
          setInLoveUntil(
            data.inLoveUntil && data.inLoveUntil > Date.now()
              ? data.inLoveUntil
              : null,
          );
        }
      } catch (error) {}
    };

    // Fetch initially
    fetchUserPotions();

    // Poll every 60 seconds for potion effects
    const interval = setInterval(fetchUserPotions, 60000);

    return () => clearInterval(interval);
  }, []);
  const chatBoxRef = useRef(null);

  // Helper functions for potion effects
  const getRandomColor = () => {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const translateText = (text) => {
    const translations = {
      hello: "hola",
      hi: "ciao",
      goodbye: "adios",
      thanks: "gracias",
      yes: "si",
      no: "nein",
      maybe: "peut-être",
      love: "amour",
      friend: "ami",
      magic: "magie",
      potion: "poción",
      wizard: "mago",
    };
    return text
      .split(" ")
      .map((word) => {
        const lower = word.toLowerCase().replace(/[^\w]/g, "");
        return translations[lower] || word;
      })
      .join(" ");
  };

  const getMessageStyle = (message) => {
    let style = {};

    // Check if message has potion effects stored
    if (message.potionEffects) {
      // Hair Color Potion
      if (message.potionEffects.hairColor) {
        style.color = message.potionEffects.hairColor;
      }

      // Rainbow Potion
      if (message.potionEffects.rainbow) {
        style.color = message.potionEffects.rainbowColor;
      }

      // Shout Potion
      if (message.potionEffects.shout) {
        style.textTransform = "uppercase";
        style.fontWeight = "bold";
      }
    }

    return style;
  };

  const getDisplayName = (message) => {
    // Check if message has potion effects stored
    if (message.potionEffects && message.potionEffects.mystery) {
      return "???";
    }

    return message.sender;
  };

  const getDisplayText = (text, message) => {
    // Check if message has potion effects stored
    if (message.potionEffects && message.potionEffects.translation) {
      return translateText(text);
    }

    return text;
  };

  // Sjekk om innlogget bruker har admin, professor, headmaster eller shadow patrol-rolle
  const currentUserObj = users.find(
    (u) =>
      u.displayName &&
      u.displayName.toLowerCase() ===
        auth.currentUser?.displayName?.toLowerCase(),
  );
  const canDelete = currentUserObj?.roles?.some((r) =>
    ["admin", "professor", "teacher", "headmaster", "shadowpatrol", "archivist"].includes(
      (r || "").toLowerCase(),
    ),
  );

  const canSendNotification = currentUserObj?.roles?.some(
    (r) => r.toLowerCase() === "admin",
  );

  // Slett melding
  const handleDeleteMessage = async (id) => {
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      setError("Could not delete message.");
    }
  };

  // Send admin notification (news) to chat
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationText.trim()) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: notificationText.trim(),
        type: "notification",
        sender: "News",
        timestamp: serverTimestamp(),
      });
      setNotificationText("");
      setShowNotificationModal(false);
      trimGeneralChatToLimit(30);
    } catch (err) {
      setError("Could not send notification.");
    }
  };

  // Scroll meldingslisten til bunn så siste (nyeste) melding vises
  const scrollChatToBottom = () => {
    const el = chatBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    if (!autoScrollToBottom) return;
    const isPc = window.innerWidth > 768;
    const chatVisible = isPc ? !isCollapsed : true;
    if (!chatVisible) return;
    scrollChatToBottom();
    const t1 = setTimeout(scrollChatToBottom, 50);
    const t2 = setTimeout(scrollChatToBottom, 150);
    const t3 = setTimeout(scrollChatToBottom, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages, isCollapsed, autoScrollToBottom]);

  // Ping notification for mentions (only when a *new* message mentions you, not on load)
  const lastSeenMessageIdRef = useRef(null);
  useEffect(() => {
    if (!auth.currentUser || messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    const latestId = latestMessage.id;
    const messageText = latestMessage.text || "";
    const userName = auth.currentUser.displayName || "";
    const messageSender = latestMessage.sender || "";

    const isNewMessage = lastSeenMessageIdRef.current !== latestId;
    lastSeenMessageIdRef.current = latestId;

    if (
      isNewMessage &&
      messageSender !== userName &&
      (messageText.toLowerCase().includes(`@${userName.toLowerCase()}`) ||
        messageText.toLowerCase().includes("@all"))
    ) {
      playPing();
    }
  }, [messages]);

  // ----------------------FORMATTING FUNCTION-----------------------
  const formatMessage = (text) => {
    // Handle /i for italic - matches /i followed by text until end or another command
    let formattedText = text.replace(
      /\/i\s+([^\/]+?)(?=\s*$|\s+\/[biu])/g,
      "<em>$1</em>",
    );

    // Handle /b for bold
    formattedText = formattedText.replace(
      /\/b\s+([^\/]+?)(?=\s*$|\s+\/[biu])/g,
      "<strong>$1</strong>",
    );

    // Handle /u for underline
    formattedText = formattedText.replace(
      /\/u\s+([^\/]+?)(?=\s*$|\s+\/[biu])/g,
      "<u>$1</u>",
    );

    return formattedText;
  };

  // Trim general chat to max 30 messages (delete oldest). Runs after send.
  const trimGeneralChatToLimit = async (maxCount = 30) => {
    try {
      while (true) {
        const q = query(
          collection(db, "messages"),
          orderBy("timestamp", "asc"),
          limit(100),
        );
        const snap = await getDocs(q);
        if (snap.size <= maxCount) break;
        const toDelete = snap.docs.slice(0, snap.size - maxCount);
        for (const d of toDelete) {
          await deleteDoc(d.ref);
        }
      }
    } catch (err) {
      // Non-blocking; ignore trim errors
    }
  };

  // ----------------------SEND MESSAGE FUNCTION-----------------------
  const sendtMessage = async (e) => {
    e.preventDefault();
    if (!newMess.trim()) return;

    // Whisper Potion - only allow private messages
    if (whisperUntil && whisperUntil > Date.now()) {
      if (!newMess.toLowerCase().includes("@")) {
        setError("Whisper Potion active: You can only send private messages!");
        return;
      }
    }

    try {
      const messageText = formatMessage(newMess);

      // Prepare potion effects for this message
      const potionEffects = {};
      if (hairColorUntil && hairColorUntil > Date.now()) {
        potionEffects.hairColor = getRandomColor();
      }
      if (rainbowUntil && rainbowUntil > Date.now()) {
        potionEffects.rainbow = true;
        potionEffects.rainbowColor = rainbowColor;
      }
      if (shoutUntil && shoutUntil > Date.now()) {
        potionEffects.shout = true;
      }
      if (translationUntil && translationUntil > Date.now()) {
        potionEffects.translation = true;
      }
      if (mysteryUntil && mysteryUntil > Date.now()) {
        potionEffects.mystery = true;
      }
      if (glowUntil && glowUntil > Date.now()) {
        potionEffects.glow = true;
      }
      if (charmUntil && charmUntil > Date.now()) {
        potionEffects.charm = true;
      }
      if (inLoveUntil && inLoveUntil > Date.now()) {
        potionEffects.love = true;
      }

      // Echo Potion - send message twice
      if (echoUntil && echoUntil > Date.now()) {
        await addDoc(collection(db, "messages"), {
          text: messageText,
          sender: auth.currentUser?.displayName || "",
          timestamp: serverTimestamp(),
          potionEffects:
            Object.keys(potionEffects).length > 0 ? potionEffects : null,
        });
        // Send echo
        await addDoc(collection(db, "messages"), {
          text: messageText,
          sender: auth.currentUser?.displayName || "",
          timestamp: serverTimestamp(),
          potionEffects:
            Object.keys(potionEffects).length > 0 ? potionEffects : null,
        });
        trimGeneralChatToLimit(30);
      } else {
        await addDoc(collection(db, "messages"), {
          text: messageText,
          sender: auth.currentUser?.displayName || "",
          timestamp: serverTimestamp(),
          potionEffects:
            Object.keys(potionEffects).length > 0 ? potionEffects : null,
        });
      }
      setNewMess("");
      trimGeneralChatToLimit(30);
      if (autoScrollToBottom) {
        setTimeout(scrollChatToBottom, 100);
        setTimeout(scrollChatToBottom, 400);
      }
    } catch (err) {
      setError("Could not send message.");
    }
  };

  // Filtrer kun online brukere for @mention autocomplete
  const mentionableUsers = onlineUsers.filter(
    (u) =>
      u.displayName &&
      (!mentionQuery ||
        u.displayName.toLowerCase().startsWith(mentionQuery.toLowerCase())),
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
      setMentionActiveIdx(0);
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

  // Tastaturnavigering for dropdown
  const handleMentionKeyDown = (e) => {
    if (showMentions && mentionableUsers.length > 0) {
      if (e.key === "ArrowDown") {
        setMentionActiveIdx((idx) => (idx + 1) % mentionableUsers.length);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setMentionActiveIdx(
          (idx) =>
            (idx - 1 + mentionableUsers.length) % mentionableUsers.length,
        );
        e.preventDefault();
      } else if (e.key === "Enter") {
        handleSelectMention(mentionableUsers[mentionActiveIdx].displayName);
        e.preventDefault();
      }
    } else if (e.key === "Enter") {
      // Send message when Enter is pressed and no mention dropdown is open
      e.preventDefault();
      sendtMessage(e);
    }
  };

  const isPc = window.innerWidth > 768;
  return (
    <div
      className={isPc && !isCollapsed ? styles.chatPanelSticky : undefined}
      style={{
        position: isPc ? "fixed" : "relative",
        top: isPc && !isCollapsed ? 0 : "auto",
        bottom: isPc ? 0 : "auto",
        right: isPc ? 0 : "auto",
        width: isPc ? 350 : "100%",
        height: isPc ? (isCollapsed ? "auto" : "100vh") : "100vh",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        zIndex: isPc ? 10005 : 1,
      }}
    >
      {isPc && (
        <div
          style={{
            flexShrink: 0,
            background: "#5D4E37",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            border: "1px solid #7B6857",
            borderBottom: isCollapsed ? "1px solid #7B6857" : "none",
          }}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <span style={{ flex: 1, color: "#F5EFE0", fontWeight: 600 }}>
            Chat
          </span>
          {canSendNotification && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotificationModal(true);
              }}
              className={styles.notificationBtn}
              title="Send news / notification to chat"
              aria-label="Send news notification"
            >
              📢
            </button>
          )}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#F5EFE0",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            {isCollapsed ? "▲" : "▼"}
          </button>
        </div>
      )}
      {(isPc ? !isCollapsed : true) && (
        <div
          className={`${styles.chatContainer} ${isPc ? styles.chatContainerPc : ""}`}
          style={{
            borderTopLeftRadius: !isPc ? 12 : 0,
            borderTopRightRadius: !isPc ? 12 : 0,
            borderTop: !isPc ? "1px solid #7B6857" : "none",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            height: isPc ? undefined : "100%",
          }}
        >
          {!isPc && (
            <div
              style={{
                background: "#5D4E37",
                padding: "0.8rem 1rem",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: "1px solid #7B6857",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  color: "#F5EFE0",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  margin: 0,
                  fontFamily: '"Cinzel", serif',
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                }}
              >
                Main Chat
              </h3>
              {canSendNotification && (
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(true)}
                  className={styles.notificationBtn}
                  title="Send news / notification to chat"
                  aria-label="Send news notification"
                >
                  📢
                </button>
              )}
            </div>
          )}
          <div
            className={styles.chatMessages}
            ref={chatBoxRef}
            style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
          >
            {messages.map((message) => {
              if (message.type === "notification") {
                return (
                  <div key={message.id} className={styles.notificationMessage}>
                    <span className={styles.notificationLabel}>📢 News</span>
                    <span
                      className={styles.notificationContent}
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(
                          (message.text || "")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;"),
                        ),
                      }}
                    />
                  </div>
                );
              }

              const userObj = users.find(
                (u) =>
                  u.displayName &&
                  u.displayName.toLowerCase() === message.sender?.toLowerCase(),
              );

              let roleClass = styles.messageSender;
              let nameColor = null;
              if (userObj?.roles?.some((r) => r.toLowerCase() === "headmaster"))
                roleClass += ` ${styles.headmasterSender}`;
              else if (
                userObj?.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
              )
                roleClass += ` ${styles.professorSender}`;
              else if (
                userObj?.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
              )
                roleClass += ` ${styles.shadowPatrolSender}`;
              else if (userObj?.roles?.some((r) => r.toLowerCase() === "admin"))
                roleClass += ` ${styles.adminSender}`;
              else if (
                userObj?.roles?.some((r) => r.toLowerCase() === "archivist")
              )
                roleClass += ` ${styles.archivistSender}`;
              else {
                // Use race color for students with race; otherwise light beige so they stand out (especially in dark mode)
                const raceColor = getRaceColor(userObj?.race);
                nameColor =
                  userObj?.race && raceColor !== "#FFFFFF"
                    ? raceColor
                    : "#D4C4A8"; /* default: light beige for users without role */
              }
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
                              menuOpenId === message.id ? null : message.id,
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
                              fill="#5D4E37"
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
                    <strong
                      className={roleClass}
                      style={{
                        ...(nameColor ? { color: nameColor, textShadow: "0 1px 2px rgba(0,0,0,0.3)" } : {}),
                        ...(message.potionEffects && message.potionEffects.glow
                          ? {
                              textShadow:
                                "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700",
                              color: "#ffd700",
                            }
                          : {}),
                        ...(message.potionEffects && message.potionEffects.charm
                          ? {
                              textShadow:
                                "0 0 8px #ff69b4, 0 0 16px #ff1493, 0 0 24px #ff69b4",
                              color: "#ff69b4",
                              position: "relative",
                            }
                          : {}),
                      }}
                    >
                      {getDisplayName(message)
                        ? (() => {
                            const displayName = getDisplayName(message);
                            const parts = displayName.trim().split(" ");
                            if (parts.length === 1) return parts[0];
                            if (parts.length > 1)
                              return parts[0] + " " + parts[parts.length - 1];
                            return "";
                          })()
                        : ""}
                      {message.potionEffects &&
                        message.potionEffects.charm &&
                        " 💕"}
                      {message.potionEffects &&
                        message.potionEffects.love &&
                        " 💖"}
                      {userObj && onlineUids.has(userObj.uid || userObj.id) && (
                        <span className={styles.mainChatOnlineDot} aria-hidden title="Online" />
                      )}
                    </strong>
                  </span>
                  {/* Uthev @mentions og @all i meldingen */}
                  <span
                    className={
                      styles.messageText +
                      (message.text
                        ?.toLowerCase()
                        .includes(
                          `@${auth.currentUser?.displayName?.toLowerCase()}`,
                        )
                        ? " " + styles.mentionHighlight
                        : "") +
                      (message.text?.toLowerCase().includes("@all")
                        ? " " + styles.mentionAll
                        : "")
                    }
                    style={getMessageStyle(message)}
                  >
                    :{" "}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: getDisplayText(message.text, message)
                          ?.replace(
                            /@([^\s@]+(?:\s+[^\s@]+)*)/g,
                            '<span class="' +
                              styles.mentionHighlight +
                              '">@$1</span>',
                          )
                          ?.replace(
                            /@all/gi,
                            '<span class="' +
                              styles.mentionAll +
                              '">@all</span>',
                          ),
                      }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
          <div
            className={styles.autoScrollRow}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 10px",
              fontSize: "0.85rem",
              color: "var(--color-secondary-text, #7B6857)",
              flexShrink: 0,
              borderTop: "1px solid rgba(123, 104, 87, 0.3)",
            }}
            role="group"
            aria-label="Auto-scroll to last message"
          >
            <span style={{ marginRight: 4 }}>Auto-scroll to last message:</span>
            <label className={styles.autoScrollLabel}>
              <input
                type="radio"
                name="mainChatAutoScroll"
                className={styles.autoScrollRadio}
                checked={autoScrollToBottom === true}
                onChange={() => setAutoScrollToBottom(true)}
              />
              <span>On</span>
            </label>
            <label className={styles.autoScrollLabel}>
              <input
                type="radio"
                name="mainChatAutoScroll"
                className={styles.autoScrollRadio}
                checked={autoScrollToBottom === false}
                onChange={() => setAutoScrollToBottom(false)}
              />
              <span>Off</span>
            </label>
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
                  id="chat-message-input"
                  name="chatMessage"
                  ref={inputRef}
                  value={newMess}
                  onChange={handleInputChange}
                  onKeyDown={handleMentionKeyDown}
                  onFocus={preparePingSound}
                  type="text"
                  placeholder="YOUR MESSAGES..."
                  maxLength={200}
                  className={`${styles.chatInput} ${styles.textArea}`}
                  style={{ width: "100%", minWidth: 0 }}
                />
                {showMentions && mentionableUsers.length > 0 && (
                  <ul className={styles.mentionDropdown}>
                    {mentionableUsers.map((u, idx) => (
                      <li
                        key={u.displayName}
                        className={
                          styles.mentionDropdownItem +
                          (idx === mentionActiveIdx
                            ? " " + styles.mentionDropdownItemActive
                            : "")
                        }
                        onMouseDown={() => handleSelectMention(u.displayName)}
                      >
                        <div className={styles.username}>@{u.displayName}</div>
                        {u.fullName && (
                          <div className={styles.fullname}>{u.fullName}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className={styles.emojiBtn}
                  onClick={() => setShowEmoji((v) => !v)}
                  aria-label="Add emoji"
                >
                  😊
                </button>
                {showEmoji && (
                  <div className={styles.emojiPickerWrapper}>
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji) => {
                        setNewMess(
                          (prev) => prev + (emoji.native || emoji.colons || ""),
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

      {/* Admin: News / notification popup */}
      {showNotificationModal && (
        <div
          className={styles.notificationModalOverlay}
          onClick={() => setShowNotificationModal(false)}
          onKeyDown={(e) =>
            e.key === "Escape" && setShowNotificationModal(false)
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-modal-title"
        >
          <div
            className={styles.notificationModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="notification-modal-title"
              className={styles.notificationModalTitle}
            >
              📢 News / notification
            </h3>
            <p className={styles.notificationModalHint}>
              This will appear as a small news message in the chat for everyone.
            </p>
            <form onSubmit={handleSendNotification}>
              <label
                htmlFor="chat-notification-input"
                className={styles.notificationModalLabel}
              >
                Message
              </label>
              <textarea
                id="chat-notification-input"
                name="chatNotification"
                className={styles.notificationModalInput}
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="e.g. Reminder: House meeting tonight at 8!"
                rows={3}
                autoComplete="off"
              />
              <div className={styles.notificationModalActions}>
                <Button
                  type="button"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationText("");
                  }}
                  className={styles.notificationModalCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!notificationText.trim()}>
                  Send to chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
