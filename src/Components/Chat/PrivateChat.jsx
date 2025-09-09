import { useState, useRef, useEffect } from "react";
import { playPing } from "./ping_alt";
// Varslingsfunksjon for desktop notification
const showNotification = (title, body) => {
  if (window.Notification && Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (window.Notification && Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
};
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
              if (!window.confirm("Slett denne meldingen?")) return;
              const chatId = [currentUser.uid, selectedUser.uid]
                .sort()
                .join("_");
              const msgsRef = collection(
                db,
                "privateMessages",
                chatId,
                "messages"
              );
              const { getDocs, deleteDoc } = await import("firebase/firestore");
              const docsSnap = await getDocs(msgsRef);
              const docToDelete = docsSnap.docs.find(
                (docSnap) =>
                  docSnap.data().timestamp?.seconds ===
                    message.timestamp?.seconds &&
                  docSnap.data().from === currentUser.uid &&
                  docSnap.data().text === message.text
              );
              if (docToDelete) await deleteDoc(docToDelete.ref);
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
  if (!currentUser) return null;

  // Filter users for search (exclude self and allerede synlige aktive chats, men IKKE skjulte)
  const filteredUsers = search
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

  // Oppdater localStorage når isCollapsed endres
  useEffect(() => {
    localStorage.setItem("privateChatCollapsed", isCollapsed);
  }, [isCollapsed]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [activeChats, selectedUser]);

  // Load active chats from Firestore on mount
  useEffect(() => {
    if (!currentUser) return;
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

  // Listen for messages for each active chat (for unread badges etc)
  useEffect(() => {
    if (!currentUser || !chatLoaded) return;
    const unsubscribes = activeChats.map((chat, idx) => {
      const chatId = [currentUser.uid, chat.user.uid].sort().join("_");
      const q = query(
        collection(db, "privateMessages", chatId, "messages"),
        orderBy("timestamp")
      );
      let prevMessages = chat.messages || [];
      return onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => doc.data());
        setActiveChats((prev) => {
          const updated = [...prev];
          updated[idx] = {
            ...chat,
            messages: newMessages,
          };
          return updated;
        });
        // Sjekk om det faktisk har kommet en ny melding til brukeren
        const newToMe = newMessages.filter(
          (m) => m.to === currentUser.uid && m.from !== currentUser.uid
        );
        const prevToMe = prevMessages.filter(
          (m) => m.to === currentUser.uid && m.from !== currentUser.uid
        );
        // Ping/varsel kun hvis chatten IKKE er synlig (enten collapsed eller annen bruker valgt)
        const isChatVisible =
          selectedUserRef.current &&
          selectedUserRef.current.uid === chat.user.uid &&
          !isCollapsedRef.current;
        if (
          newToMe.length > prevToMe.length &&
          !mutedRef.current &&
          !isChatVisible
        ) {
          playPing();
          const lastMsg = newToMe[newToMe.length - 1];
          showNotification(
            `Ny melding fra ${chat.user.displayName || chat.user.email}`,
            lastMsg.text || "Du har fått en ny melding!"
          );
        }
        prevMessages = newMessages;
        // Hvis det er nye uleste meldinger fra denne brukeren, fjern fra hiddenChats
        if (newMessages.some((m) => m.to === currentUser.uid && !m.read)) {
          setHiddenChats((prev) => {
            if (prev.includes(chat.user.uid)) {
              const updated = prev.filter((uid) => uid !== chat.user.uid);
              localStorage.setItem(
                "hiddenPrivateChats",
                JSON.stringify(updated)
              );
              return updated;
            }
            return prev;
          });
        }
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
    // eslint-disable-next-line
  }, [activeChats.length, currentUser, chatLoaded]);

  // Always listen for messages for the selected user
  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setSelectedMessages([]);
      return;
    }
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const q = query(
      collection(db, "privateMessages", chatId, "messages"),
      orderBy("timestamp")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setSelectedMessages(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsub();
  }, [currentUser, selectedUser]);

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
      const msgsRef = collection(db, "privateMessages", chatId, "messages");
      const { getDocs, updateDoc } = await import("firebase/firestore");
      const docsSnap = await getDocs(msgsRef);
      const docToEdit = docsSnap.docs.find(
        (docSnap) =>
          docSnap.data().timestamp?.seconds ===
            editingMessage.timestamp?.seconds &&
          docSnap.data().from === currentUser.uid &&
          docSnap.data().text === editingMessage.text
      );
      if (docToEdit) await updateDoc(docToEdit.ref, { text: message });
      setEditingMessage(null);
      setMessage("");
      return;
    }
    setMessage(""); // Tøm input umiddelbart
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    try {
      await addDoc(collection(db, "privateMessages", chatId, "messages"), {
        text: message,
        from: currentUser.uid,
        to: selectedUser.uid,
        timestamp: serverTimestamp(),
      });

      // Legg til hverandre i userChats for både avsender og mottaker
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
      // Oppdater hvis nødvendig
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
        position: "fixed",
        bottom: 0,
        right: 370,
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
          border: "2px solid #a084e8",
          borderBottom: "none",
        }}
      >
        <span
          style={{
            flex: 1,
            color: "#a084e8",
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
              stroke="#a084e8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 2px #a084e8)" }}
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <line
                x1="1"
                y1="1"
                x2="23"
                y2="23"
                stroke="#a084e8"
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
              stroke="#a084e8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 2px #a084e8)" }}
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
                              ? "#a084e8"
                              : unread > 0
                              ? "#3a2e5c"
                              : "#23232b",
                            color: isSelected
                              ? "#23232b"
                              : unread > 0
                              ? "#ff4d4f"
                              : "#a084e8",
                            border: "1px solid #a084e8",
                            borderRadius: 6,
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
                          ×
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
                        <div className={styles.privateMessageSender}>
                          {m.from === currentUser?.uid
                            ? "You"
                            : selectedUser.displayName ||
                              selectedUser.name ||
                              selectedUser.uid}
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
                            }}
                          >
                            {m.text}
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
                  );
                })}
              </div>
              <form className={styles.chatForm} onSubmit={sendMessage}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
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
                      color: "#a084e8",
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
