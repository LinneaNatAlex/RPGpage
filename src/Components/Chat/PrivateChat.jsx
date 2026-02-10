import { useState, useRef, useEffect } from "react";
// Note: Ping functionality moved to global App.jsx
// MessageMenu component for edit/delete menu
// ...existing code...
// ...existing code...
function MessageMenu({ message, currentUser, selectedUser, db, onEdit }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);
  return (
    <div className={styles.privateMessageMenu} ref={menuRef}>
      <button
        className={styles.privateMessageMenuBtn}
        aria-label="Meldingsmeny"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        tabIndex={0}
      >
        &#8230;
      </button>
      {open && (
        <div className={styles.privateMessageMenuDropdown}>
          <button
            className={styles.privateMessageMenuDropdownBtn}
            onClick={async (e) => {
              e.preventDefault();
              setOpen(false);

              try {
                const chatId = [currentUser.uid, selectedUser.uid]
                  .sort()
                  .join("_");
                const { deleteDoc, doc } = await import("firebase/firestore");

                // Use the message ID directly for deletion
                if (message.id) {
                  const messageRef = doc(
                    db,
                    "privateMessages",
                    chatId,
                    "messages",
                    message.id
                  );
                  await deleteDoc(messageRef);
                } else {
                  console.error("Message ID not found, cannot delete");
                  alert("Kunne ikke slette meldingen - mangler ID.");
                }
              } catch (error) {
                console.error("Error deleting message:", error);
                alert("Kunne ikke slette meldingen. Prøv igjen.");
              }
            }}
          >
            Delete
          </button>
          <button
            className={styles.privateMessageMenuDropdownBtn}
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onEdit(message);
            }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import styles from "./Chat.module.css";
import { FaPlus } from "react-icons/fa";
import { auth, db } from "../../firebaseConfig";
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import useUsers from "../../hooks/useUser";

const PrivateChat = () => {
  // Mute state for varsler
  const [muted, setMuted] = useState(() => {
    const stored = localStorage.getItem("privateChatMuted");
    return stored === "true";
  });
  const mutedRef = useRef(muted);
  useEffect(() => {
    localStorage.setItem("privateChatMuted", muted);
    mutedRef.current = muted;
  }, [muted]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  // Husk om chatten var lukket eller åpen (default: lukket)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("privateChatCollapsed");
    return stored === null ? true : stored === "true";
  });
  const isCollapsedRef = useRef(isCollapsed);
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);
  const [search, setSearch] = useState("");
  const [activeChats, setActiveChats] = useState([]); // [{user, messages: []}]

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

  // Load user's potion effects - fetch once instead of listening
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchPotionEffects = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHairColorUntil(
            data.hairColorUntil && data.hairColorUntil > Date.now()
              ? data.hairColorUntil
              : null
          );
          setRainbowUntil(
            data.rainbowUntil && data.rainbowUntil > Date.now()
              ? data.rainbowUntil
              : null
          );
          setGlowUntil(
            data.glowUntil && data.glowUntil > Date.now()
              ? data.glowUntil
              : null
          );
          setTranslationUntil(
            data.translationUntil && data.translationUntil > Date.now()
              ? data.translationUntil
              : null
          );
          setEchoUntil(
            data.echoUntil && data.echoUntil > Date.now()
              ? data.echoUntil
              : null
          );
          setWhisperUntil(
            data.whisperUntil && data.whisperUntil > Date.now()
              ? data.whisperUntil
              : null
          );
          setShoutUntil(
            data.shoutUntil && data.shoutUntil > Date.now()
              ? data.shoutUntil
              : null
          );
          setMysteryUntil(
            data.mysteryUntil && data.mysteryUntil > Date.now()
              ? data.mysteryUntil
              : null
          );
          setCharmUntil(
            data.charmUntil && data.charmUntil > Date.now()
              ? data.charmUntil
              : null
          );
          setInLoveUntil(
            data.inLoveUntil && data.inLoveUntil > Date.now()
              ? data.inLoveUntil
              : null
          );
        }
      } catch (error) {
        console.error("Error fetching potion effects:", error);
      }
    };
    fetchPotionEffects();
    // Refresh every 5 minutes instead of real-time listening
    const interval = setInterval(fetchPotionEffects, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Rainbow Potion effect - change color every 10 seconds
  useEffect(() => {
    if (!rainbowUntil || rainbowUntil <= Date.now()) return;

    const interval = setInterval(() => {
      setRainbowColor(getRandomColor());
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [rainbowUntil]);

  // Skjulte brukere (uid-array), lagres i localStorage
  const [hiddenChats, setHiddenChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hiddenPrivateChats") || "[]");
    } catch {
      return [];
    }
  });
  // Only one chat window
  const [chatLoaded, setChatLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const chatBoxRef = useRef(null);
  const currentUser = auth.currentUser;
  const { users, loading } = useUsers();

  // Load active chats from Firestore on mount
  useEffect(() => {
    if (!currentUser || !users) return;
    const fetchChats = async () => {
      const userChatsRef = doc(db, "userChats", currentUser.uid);
      const userChatsSnap = await getDoc(userChatsRef);
      let chatList = [];
      if (userChatsSnap.exists()) {
        const chatUids = userChatsSnap.data().chats || [];
        chatList = chatUids
          .map((uid) => users.find((u) => u.uid === uid))
          .filter(Boolean)
          .map((user) => ({ user, messages: [] }));
      }
      setActiveChats(chatList);
      setChatLoaded(true);
    };
    fetchChats();
  }, [currentUser, users]);

  // Optimized: Only listen for messages from the currently selected chat
  // Remove the multiple listeners for all active chats to reduce Firebase quota usage

  // Only listen for messages for the selected user when chat is open
  useEffect(() => {
    if (!currentUser || !selectedUser || isCollapsed) {
      setSelectedMessages([]);
      return;
    }
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const q = query(
      collection(db, "privateMessages", chatId, "messages"),
      orderBy("timestamp")
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSelectedMessages(messages);
    });
  }, [currentUser, selectedUser, isCollapsed]);

  // NOW conditional returns after ALL hooks
  if (!currentUser) return null;
  if (loading) return <div>Loading...</div>;

  // Find the current user's full data from users array
  const currentUserData = users
    ? users.find((u) => u.uid === currentUser.uid)
    : null;

  // Filter users for search (exclude self and allerede synlige aktive chats, men IKKE skjulte)
  const filteredUsers =
    search && users
      ? users.filter(
          (u) =>
            u.uid !== currentUser.uid &&
            (u.displayName || u.name || u.uid)
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            // Ikke vis brukere som allerede er synlige i activeChats (men vis skjulte)
            !activeChats.some(
              (c) => c.user.uid === u.uid && !hiddenChats.includes(u.uid)
            )
        )
      : [];

  // Add new private chat
  const addChat = async (user) => {
    // Add to Firestore userChats
    const userChatsRef = doc(db, "userChats", currentUser.uid);
    const userChatsSnap = await getDoc(userChatsRef);
    let chatUids = [];
    if (userChatsSnap.exists()) {
      chatUids = userChatsSnap.data().chats || [];
    }
    if (!chatUids.includes(user.uid)) {
      chatUids.push(user.uid);
      await setDoc(userChatsRef, { chats: chatUids }, { merge: true });
    }
    setActiveChats((prev) =>
      prev.some((c) => c.user.uid === user.uid)
        ? prev
        : [...prev, { user, messages: [] }]
    );
    setSelectedUser(user);
    setSearch("");
    setIsCollapsed(false); // Åpne chatten når ny chat startes
  };

  // Send or edit message in active chat (Firestore)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || !currentUser) return;
    if (editingMessage) {
      // Edit existing message
      const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
      const { updateDoc, doc } = await import("firebase/firestore");

      if (editingMessage.id) {
        const messageRef = doc(
          db,
          "privateMessages",
          chatId,
          "messages",
          editingMessage.id
        );
        await updateDoc(messageRef, { text: message });
      } else {
        console.error("Editing message ID not found");
        alert("Kunne ikke redigere meldingen - mangler ID.");
      }
      setEditingMessage(null);
      setMessage("");
      return;
    }
    setMessage(""); // Tøm input umiddelbart
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    try {
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

      await addDoc(collection(db, "privateMessages", chatId, "messages"), {
        text: message,
        from: currentUser.uid,
        to: selectedUser.uid,
        timestamp: serverTimestamp(),
        potionEffects:
          Object.keys(potionEffects).length > 0 ? potionEffects : null,
      });

      // Add each other in userChats for both sender and receiver
      const senderChatsRef = doc(db, "userChats", currentUser.uid);
      const receiverChatsRef = doc(db, "userChats", selectedUser.uid);
      const [senderSnap, receiverSnap] = await Promise.all([
        getDoc(senderChatsRef),
        getDoc(receiverChatsRef),
      ]);
      let senderChats = [];
      let receiverChats = [];
      if (senderSnap.exists()) senderChats = senderSnap.data().chats || [];
      if (receiverSnap.exists())
        receiverChats = receiverSnap.data().chats || [];
      // Update if necessary
      if (!senderChats.includes(selectedUser.uid)) {
        await setDoc(
          senderChatsRef,
          { chats: [...senderChats, selectedUser.uid] },
          { merge: true }
        );
      }
      if (!receiverChats.includes(currentUser.uid)) {
        await setDoc(
          receiverChatsRef,
          { chats: [...receiverChats, currentUser.uid] },
          { merge: true }
        );
      }
    } catch (err) {
      // evt. vis feilmelding
    }
  };

  // Calculate per-chat unread messages for the current user
  // Badge skal kun vises for mottaker, ikke for meldinger man selv har sendt
  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    // Kun meldinger som er sendt TIL innlogget bruker og ikke lest
    return chat.messages.filter(
      (m) => m.to === currentUser.uid && m.from !== currentUser.uid && !m.read
    ).length;
  };

  // Any chat has unread? (etter at meldinger er lest forsvinner badge umiddelbart)
  const hasUnread = activeChats.some((c) => getUnreadCount(c) > 0);

  return (
    <div
      style={{
        position: window.innerWidth <= 768 ? "relative" : "fixed",
        bottom: window.innerWidth <= 768 ? "auto" : 0,
        right: window.innerWidth <= 768 ? "auto" : 370,
        width: window.innerWidth <= 768 ? "100%" : 350,
        zIndex: window.innerWidth <= 768 ? 1 : 10005,
        
      }}
    >
      {window.innerWidth > 768 && (
        <div
          style={{
            background: "#5D4E37",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            border: "1px solid #7B6857",
            borderBottom: "none",
          }}
        >
          <span
            style={{
              flex: 1,
              color: "#F5EFE0",
              fontWeight: 600,
              position: "relative",
            }}
          >
            Private Chat
            {hasUnread && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -18,
                  background: "#ff4d4f",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 0 2px #000",
                }}
              >
                !
              </span>
            )}
          </span>
          {/* Mute/unmute icon button */}
          <button
            onClick={() => setMuted((m) => !m)}
            style={{
              background: "none",
              border: "none",
              marginLeft: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: 0,
              outline: "none",
            }}
            title={muted ? "Slå på varsler" : "Slå av varsler"}
          >
            {muted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#7B6857"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 2px #7B6857)" }}
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line
                  x1="1"
                  y1="1"
                  x2="23"
                  y2="23"
                  stroke="#7B6857"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#7B6857"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 2px #7B6857)" }}
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            )}
          </button>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#F5EFE0",
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
              color: "#F5EFE0",
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
      )}
      {(window.innerWidth > 768 ? !isCollapsed : true) && (
        <div
          className={styles.chatContainer}
          style={{
            borderTopLeftRadius: window.innerWidth <= 768 ? 12 : 0,
            borderTopRightRadius: window.innerWidth <= 768 ? 12 : 0,
            borderTop: window.innerWidth <= 768 ? "1px solid #7B6857" : "none",
            height: 500,
            minHeight: 200,
          }}
        >
          {window.innerWidth <= 768 && (
            <div
              style={{
                background: "#5D4E37",
                padding: "0.8rem 1rem",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: "1px solid #7B6857",
                marginBottom: "1rem",
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
                Private Chat
              </h3>
            </div>
          )}
          <div style={{ padding: "0.5rem 1rem" }}>
            <input
              id="private-chat-search-user"
              name="privateChatSearchUser"
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 0,
                border: "1px solid #7B6857",
                marginBottom: 8,
                background: "#6B5B47",
                color: "#F5EFE0",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
            {filteredUsers.length > 0 && (
              <div
                style={{
                  background: "#5D4E37",
                  border: "1px solid #7B6857",
                  borderRadius: 0,
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              >
                {filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    style={{ padding: 8, cursor: "pointer", color: "#F5EFE0" }}
                    onClick={() => {
                      // Hvis brukeren er skjult, fjern fra hiddenChats og vis igjen
                      setHiddenChats((prev) => {
                        if (prev.includes(u.uid)) {
                          const updated = prev.filter((id) => id !== u.uid);
                          localStorage.setItem(
                            "hiddenPrivateChats",
                            JSON.stringify(updated)
                          );
                          return updated;
                        }
                        return prev;
                      });
                      // Alltid set selected user og åpne chat
                      const existing = activeChats.find(
                        (c) => c.user.uid === u.uid
                      );
                      if (existing) {
                        setSelectedUser(existing.user);
                        setSearch("");
                        setIsCollapsed(false);
                      } else {
                        addChat(u);
                      }
                    }}
                  >
                    {u.displayName || u.name || u.uid}
                  </div>
                ))}
              </div>
            )}
            {activeChats.length > 0 && (
              <div className={styles.activeChatsRow}>
                {activeChats
                  .filter((c) => !hiddenChats.includes(c.user.uid))
                  .map((c) => {
                    const unread = getUnreadCount(c);
                    const isSelected = selectedUser?.uid === c.user.uid;
                    return (
                      <span
                        key={c.user.uid}
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <button
                          style={{
                            background: isSelected
                              ? "#7B6857"
                              : unread > 0
                              ? "#6B5B47"
                              : "#5D4E37",
                            color: isSelected
                              ? "#F5EFE0"
                              : unread > 0
                              ? "#ff4d4f"
                              : "#F5EFE0",
                            border: "1px solid #7B6857",
                            borderRadius: 0,
                            padding: "4px 10px",
                            cursor: "pointer",
                            position: "relative",
                            fontWeight: unread > 0 ? 700 : 400,
                          }}
                          onClick={async () => {
                            setSelectedUser(c.user);
                            setTimeout(() => {
                              if (chatBoxRef.current) {
                                chatBoxRef.current.scrollTop =
                                  chatBoxRef.current.scrollHeight;
                              }
                            }, 100);
                            // Force a re-render to show message history
                            setActiveChats((prev) => [...prev]);
                            // Marker alle meldinger som lest i Firestore NÅR chatten åpnes
                            const chatId = [currentUser.uid, c.user.uid]
                              .sort()
                              .join("_");
                            const msgsRef = collection(
                              db,
                              "privateMessages",
                              chatId,
                              "messages"
                            );
                            if (unread > 0) {
                              const { getDocs, writeBatch } = await import(
                                "firebase/firestore"
                              );
                              const docsSnap = await getDocs(msgsRef);
                              const batch = writeBatch(db);
                              docsSnap.forEach((docSnap) => {
                                const data = docSnap.data();
                                if (data.to === currentUser.uid && !data.read) {
                                  batch.update(docSnap.ref, { read: true });
                                }
                              });
                              await batch.commit();
                            }
                          }}
                        >
                          {
                            (
                              c.user.displayName ||
                              c.user.name ||
                              c.user.uid
                            ).split(" ")[0]
                          }
                          {unread > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                background: "#ff4d4f",
                                color: "#fff",
                                borderRadius: "50%",
                                width: 18,
                                height: 18,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                boxShadow: "0 0 2px #000",
                              }}
                            >
                              {unread}
                            </span>
                          )}
                        </button>
                        <button
                          aria-label="Skjul chat"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ff4d4f",
                            fontWeight: 700,
                            fontSize: 16,
                            marginLeft: 2,
                            cursor: "pointer",
                            lineHeight: 1,
                          }}
                          onClick={() => {
                            setHiddenChats((prev) => {
                              const updated = [...prev, c.user.uid];
                              localStorage.setItem(
                                "hiddenPrivateChats",
                                JSON.stringify(updated)
                              );
                              // Hvis du skjuler en aktiv chat, fjern valgt bruker
                              if (selectedUser?.uid === c.user.uid)
                                setSelectedUser(null);
                              return updated;
                            });
                          }}
                          title="Skjul chat"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
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
                {selectedMessages.map((m, i) => {
                  return (
                    <div
                      key={i}
                      className={
                        styles.privateMessageRow +
                        (m.from === currentUser?.uid ? " " + styles.me : "")
                      }
                    >
                      <div className={styles.privateMessageBubble}>
                        <img
                          src={
                            m.from === currentUser?.uid
                              ? currentUserData?.profileImageUrl ||
                                "/icons/avatar.svg"
                              : selectedUser.profileImageUrl ||
                                "/icons/avatar.svg"
                          }
                          alt="Profile"
                          className={styles.privateMessageProfilePic}
                        />
                        <div className={styles.privateMessageContent}>
                          <div
                            className={styles.privateMessageSender}
                            style={{
                              ...(m.potionEffects && m.potionEffects.glow
                                ? {
                                    textShadow:
                                      "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700",
                                    color: "#ffd700",
                                  }
                                : {}),
                              ...(m.potionEffects && m.potionEffects.charm
                                ? {
                                    textShadow:
                                      "0 0 8px #ff69b4, 0 0 16px #ff1493, 0 0 24px #ff69b4",
                                    color: "#ff69b4",
                                  }
                                : {}),
                            }}
                          >
                            {m.from === currentUser?.uid
                              ? m.potionEffects && m.potionEffects.mystery
                                ? "???"
                                : "You"
                              : selectedUser.displayName ||
                                selectedUser.name ||
                                selectedUser.uid}
                            {m.potionEffects && m.potionEffects.charm && " 💕"}
                            {m.potionEffects && m.potionEffects.love && " 💖"}
                          </div>
                          <div style={{ position: "relative" }}>
                            {m.from === currentUser?.uid && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: -28,
                                  right: -10,
                                  zIndex: 3,
                                }}
                              >
                                <MessageMenu
                                  message={m}
                                  currentUser={currentUser}
                                  selectedUser={selectedUser}
                                  db={db}
                                  onEdit={(msg) => {
                                    setEditingMessage(msg);
                                    setMessage(msg.text);
                                  }}
                                />
                              </div>
                            )}
                            <span
                              style={{
                                display: "block",
                                wordBreak: "break-word",
                                ...(m.potionEffects
                                  ? {
                                      ...(m.potionEffects.hairColor
                                        ? { color: m.potionEffects.hairColor }
                                        : {}),
                                      ...(m.potionEffects.rainbow
                                        ? {
                                            color: m.potionEffects.rainbowColor,
                                          }
                                        : {}),
                                      ...(m.potionEffects.shout
                                        ? {
                                            textTransform: "uppercase",
                                            fontWeight: "bold",
                                          }
                                        : {}),
                                    }
                                  : {}),
                              }}
                            >
                              {m.potionEffects && m.potionEffects.translation
                                ? translateText(m.text)
                                : m.text}
                            </span>
                          </div>
                          <div className={styles.privateMessageTimestamp}>
                            {m.timestamp && m.timestamp.seconds
                              ? new Date(
                                  m.timestamp.seconds * 1000
                                ).toLocaleString("no-NO", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className={styles.chatForm} onSubmit={sendMessage}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    id="private-chat-message"
                    name="privateChatMessage"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    placeholder={
                      editingMessage
                        ? "Rediger melding..."
                        : `Message ${
                            selectedUser.displayName ||
                            selectedUser.name ||
                            selectedUser.uid
                          }...`
                    }
                    maxLength={200}
                    className={styles.chatInput}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      cursor: "pointer",
                      color: "#F5EFE0",
                    }}
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
                          setMessage(
                            (prev) =>
                              prev + (emoji.native || emoji.colons || "")
                          );
                          setShowEmoji(false);
                        }}
                        theme="dark"
                      />
                    </div>
                  )}
                  {editingMessage && (
                    <button
                      type="button"
                      className={styles.chatBtn}
                      style={{ background: "#ff4d4f", marginLeft: 4 }}
                      onClick={() => {
                        setEditingMessage(null);
                        setMessage("");
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className={styles.chatBtn}>
                    {editingMessage ? "Save" : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateChat;
